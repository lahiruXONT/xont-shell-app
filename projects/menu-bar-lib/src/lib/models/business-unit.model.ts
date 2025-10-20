/**
 * Business Unit model
 * Legacy: BusinessUnit class in Domain
 */
export interface BusinessUnit {
  // Core identification
  businessUnit: string; // BU code
  businessUnitName: string; // BU name
  distributorCode: string; // Distributor code

  // Address information
  address1?: string;
  address2?: string;
  address3?: string;
  city?: string;
  postalCode?: string;
  country?: string;

  // Contact information
  telephone?: string;
  fax?: string;
  email?: string;
  webAddress?: string;

  // Logo and branding
  logo?: string; // Logo URL/path
  backgroundLogo?: string; // Background logo (V2046)

  // Status
  isActive: boolean;
  isMainBU: boolean;

  // Hierarchy
  parentBU?: string;
  childBUs?: string[];

  // Settings
  defaultCurrency?: string;
  defaultLanguage?: string;
  timezone?: string;
}

/**
 * Business Unit hierarchy tree
 */
export interface BUHierarchy {
  businessUnit: string;
  businessUnitName: string;
  level: number;
  children: BUHierarchy[];
  isExpanded: boolean;
}

/**
 * BU selector state
 */
export interface BUSelectorState {
  availableUnits: BusinessUnit[];
  currentUnit: BusinessUnit | null;
  hierarchy: BUHierarchy | null;
}
