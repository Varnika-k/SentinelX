export type IdentityType = 'user' | 'admin' | 'service-account' | 'api-token' | 'cloud-identity' | 'role';
export type IdentityStatus = 'active' | 'compromised' | 'locked' | 'suspended';
export type EnvironmentType = 'production' | 'staging' | 'development' | 'corporate' | 'cloud-aws' | 'cloud-azure' | 'kubernetes';

export interface IAMRole {
  id: string;
  name: string;
  permissions: string[];
  inheritance?: string[]; // IDs of parent roles
}

export interface EnterpriseIdentity {
  id: string;
  name: string;
  type: IdentityType;
  status: IdentityStatus;
  roles: string[]; // Role names or IDs
  lastLogin?: Date;
  riskScore: number; // 0-100
  groups: string[];
  mfaEnabled: boolean;
  clearanceLevel: number; // 1-5
  accessibleNodes: string[]; // IDs of NetworkNodes this identity can access directly
  environments: EnvironmentType[];
}

export interface IdentityRelationship {
  id: string;
  sourceId: string; // Identity ID
  targetId: string; // Identity or Node ID
  type: 'access' | 'trust' | 'assume-role' | 'manages';
  trustLevel: number; // 0-1
}

export interface PrivilegeEscalationPath {
  id: string;
  path: string[]; // Sequence of Identities and Nodes
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  technique: string; // e.g., "Token Theft", "Policy Misconfig"
}

export interface EnvironmentSegment {
  id: string;
  type: EnvironmentType;
  label: string;
  trustBoundaries: string[]; // Other environment IDs it trusts
  nodes: string[]; // Node IDs in this segment
  securityLevel: number; // 0-1
}
