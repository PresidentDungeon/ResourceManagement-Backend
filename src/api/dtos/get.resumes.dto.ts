export interface GetResumesDTO {
  searchFilter: string
  shouldLoadResumeCount: boolean
  excludeContract?: number
  startDate?: Date
  endDate?: Date
}
