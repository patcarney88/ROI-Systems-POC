# Cascade Configuration

This directory contains configuration files for Cascade (Claude Code) integration with the ROI Systems POC project.

## Files

### `agent-coordination.json`
Main configuration file that defines how Cascade coordinates with Superforge agents.

**Key Features:**
- Cooperative mode between Cascade and Superforge
- Clear role separation (orchestrator vs executor)
- Parallel execution support for 64 agents
- Dashboard integration for real-time monitoring
- Quality gate definitions
- Conflict resolution protocols

## How It Works

### Cascade's Role
Cascade acts as the **orchestrator**:
- Receives and interprets user requests
- Breaks down complex tasks into manageable pieces
- Delegates specialized work to Superforge personas
- Monitors progress via the team dashboard
- Validates quality gates
- Integrates final deliverables
- Handles all user communication

### Superforge's Role
Superforge agents act as **executors**:
- 64 parallel agents across 22 specialized personas
- Execute development, testing, design, and infrastructure tasks
- Use hive-mind protocol for autonomous coordination
- Report progress to the dashboard
- Escalate conflicts to Cascade when needed

## Integration Points

### 1. Task Delegation
Cascade delegates tasks to Superforge personas based on expertise:
```json
{
  "task": "Implement authentication API",
  "personas": ["backend-lead", "security-engineer", "database-specialist"],
  "priority": "high"
}
```

### 2. Progress Monitoring
Real-time dashboard at http://localhost:4000 shows:
- All active agents and their current tasks
- Progress percentages
- Completed/in-progress/pending task counts
- Activity feed with complete audit trail

### 3. Quality Gates
Five quality gates ensure high standards:
1. **Requirements** (Cascade owned)
2. **Design** (Cascade owned)
3. **Implementation** (Superforge owned, Cascade validates)
4. **Testing** (Superforge owned, Cascade validates)
5. **Deployment** (Cascade owned)

### 4. Conflict Resolution
When conflicts arise:
1. System pauses affected workflows
2. Cascade consults relevant personas
3. Consensus mechanism applied
4. Cascade makes final decision
5. Work resumes

## Configuration Details

### Resource Allocation
- **Cascade**: 20% (coordination, review, integration)
- **Superforge**: 80% (parallel execution)

### Concurrency Limits
- Max Superforge agents: 64 simultaneous
- Max Cascade parallel tasks: 10
- File locking: Enabled
- Merge strategy: Cascade reviews all

### Communication Protocol
- **Cascade → Superforge**: Task queue with structured JSON
- **Superforge → Cascade**: Progress webhooks to dashboard API
- **Dashboard**: WebSocket for real-time updates

## Team Mapping

Superforge personas are organized into dashboard teams:

**Development Team**
- backend-lead, frontend-lead, database-specialist, integration-specialist, performance-engineer

**QA Team**
- qa-engineer, performance-engineer, security-engineer

**Design Team**
- ux-ui-designer, product-designer, mobile-ux, visual-designer, ux-researcher

**DevOps Team**
- devops, architect, security-engineer

## Best Practices

### ✅ Do
- Let Cascade handle user communication
- Let Superforge agents work autonomously
- Monitor progress via dashboard
- Trust the hive-mind coordination
- Escalate conflicts to Cascade

### ❌ Don't
- Have Cascade interfere with agent creation
- Override hive-mind consensus without reason
- Duplicate work between systems
- Block parallel execution
- Micromanage individual agents

## Emergency Protocols

### Cascade Override
**When**: Critical bug, security incident, deployment failure  
**Action**: Cascade pauses all agents and takes direct control

### Superforge Escalation
**When**: Consensus failure, resource conflict, quality gate failure  
**Action**: Agents notify Cascade for immediate resolution

## Related Files

- `../virtual-team-config.json` - Superforge persona definitions
- `../hive-mind-protocol.md` - Agent coordination rules
- `../.superforge/config.json` - Superforge settings
- `../team-dashboard/` - Real-time monitoring dashboard
- `../CASCADE_SUPERFORGE_INTEGRATION.md` - Complete integration guide

## Quick Start

1. **Ensure dashboard is running**:
   ```bash
   cd team-dashboard
   npm start
   ```

2. **Verify configuration is loaded**:
   Configuration is automatically loaded by Cascade when working in this project.

3. **Monitor agent activity**:
   Open http://localhost:4000 in your browser

4. **Delegate tasks naturally**:
   Just describe what you need - Cascade will handle delegation to appropriate Superforge personas

## Status

✅ **Integration Active**  
✅ **Dashboard Running** (http://localhost:4000)  
✅ **64 Agents Available**  
✅ **Parallel Execution Enabled**  
✅ **Conflict Resolution Configured**

---

*For detailed integration documentation, see `CASCADE_SUPERFORGE_INTEGRATION.md` in the project root.*
