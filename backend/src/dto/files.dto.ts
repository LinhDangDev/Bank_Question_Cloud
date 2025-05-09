import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateFilesDto {
    @IsUUID()
    @IsOptional()
    MaCauHoi?: string;

    @IsString()
    @IsOptional()
    TenFile?: string;

    @IsNumber()
    @IsOptional()
    LoaiFile?: number;

    @IsUUID()
    @IsOptional()
    MaCauTraLoi?: string;
}

export class UpdateFilesDto extends CreateFilesDto { }

export class FilesResponseDto {
    @IsUUID()
    MaFile: string;

    @IsUUID()
    @IsOptional()
    MaCauHoi?: string;

    @IsString()
    @IsOptional()
    TenFile?: string;

    @IsNumber()
    @IsOptional()
    LoaiFile?: number;

    @IsUUID()
    @IsOptional()
    MaCauTraLoi?: string;
}
