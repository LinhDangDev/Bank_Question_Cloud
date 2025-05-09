import { IsBoolean, IsDate, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateDeThiDto {
    @IsUUID()
    MaMonHoc: string;

    @IsString()
    TenDeThi: string;

    @IsBoolean()
    @IsOptional()
    DaDuyet?: boolean;
}

export class UpdateDeThiDto extends CreateDeThiDto { }

export class DeThiResponseDto {
    @IsUUID()
    MaDeThi: string;

    @IsUUID()
    MaMonHoc: string;

    @IsString()
    TenDeThi: string;

    @IsDate()
    NgayTao: Date;

    @IsBoolean()
    @IsOptional()
    DaDuyet?: boolean;
}
