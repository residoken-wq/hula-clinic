import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Medicine } from './medicine.entity';

@Entity('medicine_stocks')
export class MedicineStock {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Medicine, { eager: true })
    @JoinColumn({ name: 'medicine_id' })
    medicine: Medicine;

    @Column()
    medicine_id: number;

    @Column({ nullable: true })
    batch_number: string;

    @Column({ default: 0 })
    quantity: number;

    @Column({ type: 'date', nullable: true })
    expiry_date: Date;

    @Column({ type: 'date', nullable: true })
    import_date: Date;

    @Column({ nullable: true })
    supplier: string;

    @Column('text', { nullable: true })
    note: string;
}
