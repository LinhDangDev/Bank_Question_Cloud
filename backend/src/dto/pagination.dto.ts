import { IsOptional, IsInt, Min, IsIn, IsString, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';
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

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsString()
    isDeleted?: string;

    @IsOptional()
    @IsString()
    maCLO?: string;

    @IsOptional()
    @IsString()
    capDo?: string;

    @IsOptional()
    @IsString()
    startDate?: string;

    @IsOptional()
    @IsString()
    endDate?: string;

    @IsOptional()
    @IsString()
    includeAnswers?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    answersPage?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    answersLimit?: number;

    @IsOptional()
    @IsString()
    questionType?: string;
}
