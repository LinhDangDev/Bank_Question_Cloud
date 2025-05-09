import { IsNumber, IsUUID } from 'class-validator';

export class CreateChiTietDeThiDto {
    @IsUUID()
    MaDeThi: string;

    @IsUUID()
    MaPhan: string;

    @IsUUID()
    MaCauHoi: string;

    @IsNumber()
    ThuTu: number;
}

export class UpdateChiTietDeThiDto extends CreateChiTietDeThiDto { }

export class ChiTietDeThiResponseDto {
    @IsUUID()
    MaDeThi: string;

    @IsUUID()
    MaPhan: string;

    @IsUUID()
    MaCauHoi: string;

    @IsNumber()
    ThuTu: number;
}
