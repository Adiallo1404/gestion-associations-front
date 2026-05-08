export interface Association {
  id: number;
  name: string;           
  description?: string;
  city?: string;
  dateCreation?: string;
}

export interface AssociationFilter {
  name?: string;
  city?: string;
  dateCreation?: string;
}

export interface AssociationPage {
  content: Association[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}