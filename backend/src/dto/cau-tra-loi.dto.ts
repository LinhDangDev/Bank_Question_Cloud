import { IsBoolean, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCauTraLoiDto {
    @ApiProperty({ description: 'Question ID this answer belongs to' })
    @IsUUID()
    @IsOptional()
    MaCauHoi?: string;

    @ApiPropertyOptional({ description: 'Answer content' })
    @IsString()
    @IsOptional()
    NoiDung?: string;

    @ApiProperty({ description: 'Order of the answer' })
    @IsNumber()
    ThuTu: number;

    @ApiProperty({ description: 'Whether this is the correct answer' })
    @IsBoolean()
    LaDapAn: boolean;

    @ApiProperty({ description: 'Whether to shuffle this answer' })
    @IsBoolean()
    HoanVi: boolean;
}

export class UpdateCauTraLoiDto extends CreateCauTraLoiDto { }

export class CauTraLoiResponseDto {
    @ApiProperty({ description: 'Answer ID' })
    @IsUUID()
    MaCauTraLoi: string;

    @ApiProperty({ description: 'Question ID this answer belongs to' })
    @IsUUID()
    MaCauHoi: string;

    @ApiPropertyOptional({ description: 'Answer content' })
    @IsString()
    @IsOptional()
    NoiDung?: string;

    @ApiProperty({ description: 'Order of the answer' })
    @IsNumber()
    ThuTu: number;

    @ApiProperty({ description: 'Whether this is the correct answer' })
    @IsBoolean()
    LaDapAn: boolean;

    @ApiProperty({ description: 'Whether to shuffle this answer' })
    @IsBoolean()
    HoanVi: boolean;
}
