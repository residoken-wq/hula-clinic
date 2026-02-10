export enum IndustryType {
    CLINIC = 'clinic',
}

export interface IndustryConfig {
    type: IndustryType;
    name: string;
    enabledModules: string[];
    labels: Record<string, string>;
}

export const CLINIC_CONFIG: IndustryConfig = {
    type: IndustryType.CLINIC,
    name: 'Hula Clinic ERP - Quản lý Phòng Khám',
    enabledModules: [
        'PATIENTS', 'APPOINTMENTS', 'EMR', 'PHARMACY',
        'SERVICES', 'BILLING', 'FINANCE', 'HR', 'TASKS', 'USERS',
    ],
    labels: {
        customers: 'Bệnh nhân',
        products: 'Dịch vụ y tế',
        orders: 'Phiếu khám',
        inventory: 'Kho thuốc',
    },
};

export function getIndustryConfig(): IndustryConfig {
    return CLINIC_CONFIG;
}
