export interface Filter{
  currentPage: number
  itemsPrPage: number

  name?: string
  contractUser?: string
  statusID?: number
  roleID?: number
  sortingType?: string
  sorting?: string
}
