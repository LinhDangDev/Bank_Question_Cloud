import { IsBoolean, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateCauTraLoiDto {
    @IsUUID()
    MaCauHoi: string;

    @IsString()
    @IsOptional()
    NoiDung?: string;

    @IsNumber()
    ThuTu: number;

    @IsBoolean()
    LaDapAn: boolean;

    @IsBoolean()
    HoanVi: boolean;
}

export class UpdateCauTraLoiDto extends CreateCauTraLoiDto { }

export class CauTraLoiResponseDto {
    @IsUUID()
    MaCauTraLoi: string;

    @IsUUID()
    MaCauHoi: string;

    @IsString()
    @IsOptional()
    NoiDung?: string;

    @IsNumber()
    ThuTu: number;

    @IsBoolean()
    LaDapAn: boolean;

    @IsBoolean()
    HoanVi: boolean;
}
