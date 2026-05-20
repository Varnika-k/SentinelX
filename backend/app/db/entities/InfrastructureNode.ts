import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { InfraEntityType } from '../../schemas/telemetry';

@Entity('infrastructure_nodes')
export class InfrastructureNodeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar')
  @Index()
  name: string;

  @Column({
    type: 'varchar',
    enum: InfraEntityType
  })
  @Index()
  type: InfraEntityType;

  @Column({ type: 'varchar', nullable: true })
  @Index()
  namespace: string;

  @Column({ type: 'varchar', nullable: true })
  environment: string;

  @Column({ type: 'varchar', default: 'healthy' })
  status: string;

  @Column('simple-json', { nullable: true })
  metadata: any;

  @Column('simple-array', { nullable: true })
  relationships: string[]; // List of related node IDs

  @Column({ type: 'integer', default: 0 })
  riskScore: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
