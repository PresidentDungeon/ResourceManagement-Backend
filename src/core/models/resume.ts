export interface Resume {
  ID: number
  firstName?: string,
  middleName?: string,
  lastName?: string,
  middleLastName?: string,
  dateOfBirth?: Date, //date
  nationality?: string, //ISO 3166 Alpha-3 country code
  occupation?: string,
  summary?: summary,
  workExperience?: workExperience[],
  education?: education[],
  certificates?: certificates[],
  otherInformation?: string,
  count?: number
}


export interface certificates {
  issueDate: string, //date
  expiryDate: string, //date
  certificateTypeID: string,
  certificateTitle: string,
  issuingAuthority: string,
  certificateType: string //Allowed values: 'mandatory', 'induction', 'roleSpecific', 'siteSpecific', 'other'
}

export interface education {
  nameOfInstitution: string,
  cityOfInstitution: string,
  language: string,
  typeOfEducation: string,
  comments?: string
}

export interface summary {
  summaryHeadline: string,
  summaryBody: string
}

export interface workExperience {
  fromDate: string, //date
  toDate: string, //date
  client: string,
  clientID?: string,
  site: string,
  siteID?: string,
  roleHeld: string,
  roleHeldReferenceCode?: string,
  comments: string,
  experienceType: string //only value 'internal' or 'external'
}
