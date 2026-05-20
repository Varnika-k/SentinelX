import { 
  EnterpriseIdentity, 
  IdentityRelationship, 
  IAMRole, 
  PrivilegeEscalationPath,
  IdentityStatus
} from '../types/iam';
import { NetworkNode } from '../types/network';

export class IdentityGraphEngine {
  /**
   * Calculates the blast radius of a compromised identity.
   * Based on accessible nodes, roles, and trust relationships.
   */
  static calculateBlastRadius(
    identityId: string,
    identities: EnterpriseIdentity[],
    relationships: IdentityRelationship[],
    nodes: NetworkNode[]
  ): string[] {
    const compromisedIdentity = identities.find(i => i.id === identityId);
    if (!compromisedIdentity) return [];

    const affectedNodeIds = new Set<string>(compromisedIdentity.accessibleNodes);
    const visitedIdentities = new Set<string>([identityId]);
    const queue = [identityId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      
      // Find all identities that trust this identity or are managed by it
      const related = relationships.filter(r => 
        (r.sourceId === currentId && (r.type === 'access' || r.type === 'trust')) ||
        (r.targetId === currentId && r.type === 'trust')
      );

      for (const rel of related) {
        const nextId = rel.sourceId === currentId ? rel.targetId : rel.sourceId;
        
        // If it's a node
        if (nodes.some(n => n.id === nextId)) {
          affectedNodeIds.add(nextId);
        } else if (!visitedIdentities.has(nextId)) {
          visitedIdentities.add(nextId);
          queue.push(nextId);
          
          // Add nodes accessible by this newly reached identity
          const nextIdentity = identities.find(i => i.id === nextId);
          if (nextIdentity) {
            nextIdentity.accessibleNodes.forEach(nid => affectedNodeIds.add(nid));
          }
        }
      }
    }

    return Array.from(affectedNodeIds);
  }

  /**
   * Detects potential privilege escalation paths.
   */
  static detectEscalationPaths(
    identities: EnterpriseIdentity[],
    roles: IAMRole[],
    nodes: NetworkNode[]
  ): PrivilegeEscalationPath[] {
    const paths: PrivilegeEscalationPath[] = [];

    // Example logic: Find users with roles that inherit from admin roles
    identities.forEach(identity => {
      identity.roles.forEach(roleId => {
        const role = roles.find(r => r.id === roleId);
        if (role && role.inheritance?.some(p => p.toLowerCase().includes('admin'))) {
          paths.push({
            id: `path-${identity.id}-${roleId}`,
            path: [identity.id, roleId],
            riskLevel: 'high',
            technique: 'Role Inheritance Escalation'
          });
        }
      });

      // Misconfiguration: Service account with interactive login or broad node access
      if (identity.type === 'service-account' && identity.accessibleNodes.length > 5) {
        paths.push({
          id: `path-svca-${identity.id}`,
          path: [identity.id, ...identity.accessibleNodes.slice(0, 3)],
          riskLevel: 'medium',
          technique: 'Over-privileged Service Account'
        });
      }
    });

    return paths;
  }

  /**
   * Calculates overall risk score for an identity.
   */
  static calculateIdentityRisk(
    identity: EnterpriseIdentity,
    nodes: NetworkNode[]
  ): number {
    let score = identity.riskScore;

    // Multipliers for risky attributes
    if (!identity.mfaEnabled) score += 20;
    if (identity.clearanceLevel > 3) score += 15;
    if (identity.accessibleNodes.length > 3) score += 10;
    
    // Compromised nodes they have access to
    const compromisedAccess = identity.accessibleNodes.filter(nid => 
      nodes.find(n => n.id === nid)?.status === 'compromised'
    ).length;
    
    score += compromisedAccess * 15;

    return Math.min(100, score);
  }

  static analyzeEnvironmentExposure(
    identity: EnterpriseIdentity,
    nodes: NetworkNode[]
  ): Record<string, number> {
    const exposure: Record<string, number> = {};
    
    identity.accessibleNodes.forEach(nid => {
      const node = nodes.find(n => n.id === nid);
      if (node) {
        exposure[node.environmentId] = (exposure[node.environmentId] || 0) + 1;
      }
    });

    return exposure;
  }
}
