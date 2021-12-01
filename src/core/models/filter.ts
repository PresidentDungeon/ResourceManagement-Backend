export interface Filter{
  currentPage: number
  itemsPrPage: number
  statusID?: number
  roleID?: number

  name?: string
  contractUser?: string
  sortingType?: string
  sorting?: string

  enableCommentCount?: boolean
  enableMatchComplete?: boolean
}
