import { IsBoolean, IsNumber, IsOptional, IsString, IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCauTraLoiDto {
    @ApiProperty({ description: 'Question ID this answer belongs to' })
    @IsUUID('all', { message: 'MaCauHoi phải là một UUID hợp lệ' })
    @IsOptional()
    MaCauHoi?: string;

    @ApiProperty({ description: 'Answer content' })
    @IsString({ message: 'NoiDung phải là một chuỗi' })
    @IsNotEmpty({ message: 'NoiDung không được để trống' })
    NoiDung: string;

    @ApiProperty({ description: 'Order of the answer' })
    @IsNumber({}, { message: 'ThuTu phải là một số nguyên' })
    ThuTu: number;

    @ApiProperty({ description: 'Whether this is the correct answer' })
    @IsBoolean({ message: 'LaDapAn phải là kiểu boolean' })
    LaDapAn: boolean;

    @ApiProperty({ description: 'Whether to shuffle this answer' })
    @IsBoolean({ message: 'HoanVi phải là kiểu boolean' })
    HoanVi: boolean;
}

export class UpdateCauTraLoiDto extends CreateCauTraLoiDto { }

export class CauTraLoiResponseDto {
    @ApiProperty({ description: 'Answer ID' })
    @IsUUID('all', { message: 'MaCauTraLoi phải là một UUID hợp lệ' })
    MaCauTraLoi: string;

    @ApiProperty({ description: 'Question ID this answer belongs to' })
    @IsUUID('all', { message: 'MaCauHoi phải là một UUID hợp lệ' })
    MaCauHoi: string;

    @ApiPropertyOptional({ description: 'Answer content' })
    @IsString({ message: 'NoiDung phải là một chuỗi' })
    @IsOptional()
    NoiDung?: string;

    @ApiProperty({ description: 'Order of the answer' })
    @IsNumber({}, { message: 'ThuTu phải là một số nguyên' })
    ThuTu: number;

    @ApiProperty({ description: 'Whether this is the correct answer' })
    @IsBoolean({ message: 'LaDapAn phải là kiểu boolean' })
    LaDapAn: boolean;

    @ApiProperty({ description: 'Whether to shuffle this answer' })
    @IsBoolean({ message: 'HoanVi phải là kiểu boolean' })
    HoanVi: boolean;
}
