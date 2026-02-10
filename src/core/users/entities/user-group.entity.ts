import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { GroupPermission } from './group-permission.entity';

@Entity('user_groups')
export class UserGroup {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    name: string;

    @Column({ nullable: true })
    description: string;

    @OneToMany(() => GroupPermission, (perm) => perm.group, { eager: true, cascade: true })
    permissions: GroupPermission[];
}
