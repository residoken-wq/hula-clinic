import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserGroup } from './entities/user-group.entity';
import { GroupPermission } from './entities/group-permission.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User) private userRepo: Repository<User>,
        @InjectRepository(UserGroup) private groupRepo: Repository<UserGroup>,
        @InjectRepository(GroupPermission) private permRepo: Repository<GroupPermission>,
    ) { }

    async findOneByUsernameForAuth(username: string): Promise<any> {
        return this.userRepo.findOne({
            where: { username },
            relations: ['group', 'group.permissions'],
        });
    }

    async findAll(): Promise<User[]> {
        return this.userRepo.find({ relations: ['group'], order: { id: 'ASC' } });
    }

    async findOne(id: number): Promise<User> {
        return this.userRepo.findOne({ where: { id }, relations: ['group'] });
    }

    async createUser(data: any): Promise<User> {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const user = this.userRepo.create({ ...data, password: hashedPassword } as Partial<User>);
        return this.userRepo.save(user);
    }

    async updateUser(id: number, data: any): Promise<User> {
        if (data.password) {
            data.password = await bcrypt.hash(data.password, 10);
        }
        await this.userRepo.update(id, data);
        return this.findOne(id);
    }

    async changePassword(id: number, password: string) {
        const hashed = await bcrypt.hash(password, 10);
        await this.userRepo.update(id, { password: hashed });
        return { success: true };
    }

    async deleteUser(id: number) {
        await this.userRepo.delete(id);
        return { success: true };
    }

    async updateActivity(userId: number) {
        await this.userRepo.update(userId, { last_activity_at: new Date() });
    }

    // --- Groups ---
    async getAllGroups(): Promise<UserGroup[]> {
        return this.groupRepo.find({ relations: ['permissions'] });
    }

    async getGroupDetail(id: number): Promise<UserGroup> {
        return this.groupRepo.findOne({ where: { id }, relations: ['permissions'] });
    }

    async createGroup(data: any): Promise<UserGroup> {
        const group = this.groupRepo.create(data as Partial<UserGroup>);
        return this.groupRepo.save(group);
    }

    async updateGroupPermissions(groupId: number, permissions: any[]) {
        await this.permRepo.delete({ group_id: groupId });
        const perms = permissions.map(p => this.permRepo.create({ ...p, group_id: groupId } as Partial<GroupPermission>));
        await this.permRepo.save(perms);
        return this.getGroupDetail(groupId);
    }

    // --- Seed Admin ---
    async seedAdmin() {
        const existing = await this.userRepo.findOne({ where: { username: 'admin' } });
        if (!existing) {
            const hashed = await bcrypt.hash('admin123', 10);
            await this.userRepo.save(this.userRepo.create({
                username: 'admin',
                password: hashed,
                full_name: 'Administrator',
                is_active: true,
            }));
            console.log('✅ Admin user seeded (admin / admin123)');
        }
    }
}
