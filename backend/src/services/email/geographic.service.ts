/**
 * Geographic Service
 *
 * Provides IP geolocation functionality for email analytics:
 * - Country/region/city detection
 * - Timezone detection
 * - Map visualization data
 * - Location-based analytics
 */

import geoip from 'geoip-lite';
import { createLogger } from '../../utils/logger';

const logger = createLogger('geographic');

export interface Location {
  country: string;
  countryCode: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface LocationStats {
  location: Location;
  count: number;
  percentage: number;
}

export interface GeographicDistribution {
  total: number;
  byCountry: Record<string, number>;
  byCity: Record<string, number>;
  byRegion: Record<string, number>;
  topCountries: Array<{ country: string; code: string; count: number; percentage: number }>;
  topCities: Array<{ city: string; country: string; count: number; percentage: number }>;
  mapData: Array<{ lat: number; lng: number; count: number }>;
}

class GeographicService {
  /**
   * Get location from IP address
   */
  async getLocationFromIP(ipAddress: string): Promise<Location | null> {
    try {
      // Handle localhost and private IPs
      if (this.isPrivateIP(ipAddress)) {
        logger.debug(`Skipping private IP: ${ipAddress}`);
        return this.getDefaultLocation();
      }

      const geo = geoip.lookup(ipAddress);

      if (!geo) {
        logger.debug(`No location found for IP: ${ipAddress}`);
        return null;
      }

      return {
        country: geo.country || 'Unknown',
        countryCode: geo.country || 'XX',
        region: geo.region || 'Unknown',
        city: geo.city || 'Unknown',
        latitude: geo.ll[0],
        longitude: geo.ll[1],
        timezone: geo.timezone || 'UTC'
      };
    } catch (error) {
      logger.error(`Failed to get location for IP ${ipAddress}:`, error);
      return null;
    }
  }

  /**
   * Get timezone from IP address
   */
  async getTimeZone(ipAddress: string): Promise<string> {
    const location = await this.getLocationFromIP(ipAddress);
    return location?.timezone || 'UTC';
  }

  /**
   * Aggregate events by location
   */
  async aggregateByLocation(
    ipAddresses: string[]
  ): Promise<LocationStats[]> {
    const locationCounts = new Map<string, { location: Location; count: number }>();
    const total = ipAddresses.length;

    for (const ip of ipAddresses) {
      const location = await this.getLocationFromIP(ip);
      if (!location) continue;

      const key = `${location.city}, ${location.country}`;
      const existing = locationCounts.get(key);

      if (existing) {
        existing.count++;
      } else {
        locationCounts.set(key, { location, count: 1 });
      }
    }

    // Convert to array and add percentages
    const results: LocationStats[] = [];
    for (const [, data] of locationCounts) {
      results.push({
        location: data.location,
        count: data.count,
        percentage: (data.count / total) * 100
      });
    }

    // Sort by count descending
    results.sort((a, b) => b.count - a.count);

    return results;
  }

  /**
   * Get geographic distribution for visualization
   */
  async getGeographicDistribution(
    ipAddresses: string[]
  ): Promise<GeographicDistribution> {
    const byCountry: Record<string, number> = {};
    const byCity: Record<string, number> = {};
    const byRegion: Record<string, number> = {};
    const mapPoints: Map<string, { lat: number; lng: number; count: number }> = new Map();

    for (const ip of ipAddresses) {
      const location = await this.getLocationFromIP(ip);
      if (!location) continue;

      // Country breakdown
      byCountry[location.country] = (byCountry[location.country] || 0) + 1;

      // City breakdown
      const cityKey = `${location.city}, ${location.country}`;
      byCity[cityKey] = (byCity[cityKey] || 0) + 1;

      // Region breakdown
      byRegion[location.region] = (byRegion[location.region] || 0) + 1;

      // Map points (aggregate nearby locations)
      const mapKey = `${location.latitude.toFixed(2)},${location.longitude.toFixed(2)}`;
      const existing = mapPoints.get(mapKey);
      if (existing) {
        existing.count++;
      } else {
        mapPoints.set(mapKey, {
          lat: location.latitude,
          lng: location.longitude,
          count: 1
        });
      }
    }

    const total = ipAddresses.length;

    // Create top countries list
    const topCountries = Object.entries(byCountry)
      .map(([country, count]) => ({
        country,
        code: this.getCountryCode(country),
        count,
        percentage: (count / total) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Create top cities list
    const topCities = Object.entries(byCity)
      .map(([cityCountry, count]) => {
        const [city, country] = cityCountry.split(', ');
        return {
          city,
          country,
          count,
          percentage: (count / total) * 100
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Convert map points to array
    const mapData = Array.from(mapPoints.values());

    return {
      total,
      byCountry,
      byCity,
      byRegion,
      topCountries,
      topCities,
      mapData
    };
  }

  /**
   * Get country name from country code
   */
  getCountryName(countryCode: string): string {
    const countries: Record<string, string> = {
      US: 'United States',
      CA: 'Canada',
      GB: 'United Kingdom',
      AU: 'Australia',
      DE: 'Germany',
      FR: 'France',
      JP: 'Japan',
      CN: 'China',
      IN: 'India',
      BR: 'Brazil',
      MX: 'Mexico',
      ES: 'Spain',
      IT: 'Italy',
      NL: 'Netherlands',
      SE: 'Sweden',
      // Add more as needed
    };

    return countries[countryCode] || countryCode;
  }

  /**
   * Get country code from country name
   */
  getCountryCode(countryName: string): string {
    const codes: Record<string, string> = {
      'United States': 'US',
      'Canada': 'CA',
      'United Kingdom': 'GB',
      'Australia': 'AU',
      'Germany': 'DE',
      'France': 'FR',
      'Japan': 'JP',
      'China': 'CN',
      'India': 'IN',
      'Brazil': 'BR',
      'Mexico': 'MX',
      'Spain': 'ES',
      'Italy': 'IT',
      'Netherlands': 'NL',
      'Sweden': 'SE',
      // Add more as needed
    };

    return codes[countryName] || countryName;
  }

  /**
   * Check if IP is private/local
   */
  private isPrivateIP(ip: string): boolean {
    if (ip === '127.0.0.1' || ip === 'localhost' || ip === '::1') {
      return true;
    }

    // Check for private IP ranges
    const parts = ip.split('.');
    if (parts.length !== 4) return false;

    const first = parseInt(parts[0]);
    const second = parseInt(parts[1]);

    // 10.0.0.0 – 10.255.255.255
    if (first === 10) return true;

    // 172.16.0.0 – 172.31.255.255
    if (first === 172 && second >= 16 && second <= 31) return true;

    // 192.168.0.0 – 192.168.255.255
    if (first === 192 && second === 168) return true;

    return false;
  }

  /**
   * Get default location (for private IPs)
   */
  private getDefaultLocation(): Location {
    return {
      country: 'Unknown',
      countryCode: 'XX',
      region: 'Unknown',
      city: 'Unknown',
      latitude: 0,
      longitude: 0,
      timezone: 'UTC'
    };
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers

    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Group nearby locations for clustering
   */
  groupNearbyLocations(
    locations: Array<{ lat: number; lng: number; count: number }>,
    distanceThreshold: number = 50 // km
  ): Array<{ lat: number; lng: number; count: number }> {
    const grouped: Array<{ lat: number; lng: number; count: number }> = [];

    for (const loc of locations) {
      let merged = false;

      for (const group of grouped) {
        const distance = this.calculateDistance(
          loc.lat,
          loc.lng,
          group.lat,
          group.lng
        );

        if (distance <= distanceThreshold) {
          // Merge into this group (weighted average)
          const totalCount = group.count + loc.count;
          group.lat = (group.lat * group.count + loc.lat * loc.count) / totalCount;
          group.lng = (group.lng * group.count + loc.lng * loc.count) / totalCount;
          group.count = totalCount;
          merged = true;
          break;
        }
      }

      if (!merged) {
        grouped.push({ ...loc });
      }
    }

    return grouped;
  }
}

// Export singleton instance
export const geographicService = new GeographicService();
