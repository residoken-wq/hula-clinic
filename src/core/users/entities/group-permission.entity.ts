import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { UserGroup } from './user-group.entity';

@Entity('group_permissions')
export class GroupPermission {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => UserGroup, (group) => group.permissions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'group_id' })
    group: UserGroup;

    @Column()
    group_id: number;

    @Column()
    module_code: string; // PATIENTS, APPOINTMENTS, EMR, PHARMACY, SERVICES, BILLING, FINANCE, HR, TASKS, USERS

    @Column({ default: false })
    can_view: boolean;

    @Column({ default: false })
    can_edit: boolean;

    @Column({ default: false })
    can_delete: boolean;
}
