import { IsBoolean, IsDate, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateCauHoiDto {
    @IsUUID()
    MaPhan: string;

    @IsNumber()
    MaSoCauHoi: number;

    @IsString()
    @IsOptional()
    NoiDung?: string;

    @IsBoolean()
    HoanVi: boolean;

    @IsNumber()
    CapDo: number;

    @IsNumber()
    SoCauHoiCon: number;

    @IsNumber()
    @IsOptional()
    DoPhanCachCauHoi?: number;

    @IsUUID()
    @IsOptional()
    MaCauHoiCha?: string;

    @IsBoolean()
    @IsOptional()
    XoaTamCauHoi?: boolean;

    @IsNumber()
    @IsOptional()
    SoLanDuocThi?: number;

    @IsNumber()
    @IsOptional()
    SoLanDung?: number;

    @IsUUID()
    @IsOptional()
    MaCLO?: string;
}

export class UpdateCauHoiDto extends CreateCauHoiDto { }

export class CauHoiResponseDto {
    @IsUUID()
    MaCauHoi: string;

    @IsUUID()
    MaPhan: string;

    @IsNumber()
    MaSoCauHoi: number;

    @IsString()
    @IsOptional()
    NoiDung?: string;

    @IsBoolean()
    HoanVi: boolean;

    @IsNumber()
    CapDo: number;

    @IsNumber()
    SoCauHoiCon: number;

    @IsNumber()
    @IsOptional()
    DoPhanCachCauHoi?: number;

    @IsUUID()
    @IsOptional()
    MaCauHoiCha?: string;

    @IsBoolean()
    @IsOptional()
    XoaTamCauHoi?: boolean;

    @IsNumber()
    @IsOptional()
    SoLanDuocThi?: number;

    @IsNumber()
    @IsOptional()
    SoLanDung?: number;

    @IsDate()
    @IsOptional()
    NgayTao?: Date;

    @IsDate()
    @IsOptional()
    NgaySua?: Date;

    @IsUUID()
    @IsOptional()
    MaCLO?: string;
}
