export class PaginationDto<T> {
  data: T[];
  count: number;
  pageIndex: number;
  pageSize: number;
}
