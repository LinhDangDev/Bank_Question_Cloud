import { IsOptional, IsInt, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { PAGINATION_CONSTANTS } from '../constants/pagination.constants';

export class PaginationDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = PAGINATION_CONSTANTS.DEFAULT_PAGE;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @IsIn(PAGINATION_CONSTANTS.AVAILABLE_LIMITS)
    limit?: number = PAGINATION_CONSTANTS.DEFAULT_LIMIT;
}
