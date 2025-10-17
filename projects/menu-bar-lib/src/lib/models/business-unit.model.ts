export interface BusinessUnit {
  businessUnitCode: string;
  businessUnitName: string;
  isActive: boolean;
  distributorCode?: string;
  parentBusinessUnit?: string;
  level?: number;
  settings?: BusinessUnitSettings;
}

export interface BusinessUnitSettings {
  theme: string;
  language: string;
  timeZone: string;
  dateFormat: string;
  currency: string;
}

export interface BusinessUnitSelection {
  businessUnit: BusinessUnit;
  timestamp: Date;
  userId: string;
}
