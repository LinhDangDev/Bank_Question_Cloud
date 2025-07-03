import { IsBoolean, IsDate, IsEmail, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateUserDto {
    @IsString()
    TenDangNhap: string;

    @IsEmail()
    Email: string;

    @IsString()
    HoTen: string;

    @IsString()
    MatKhau: string;

    @IsBoolean()
    @IsOptional()
    DaXoa?: boolean;

    @IsBoolean()
    @IsOptional()
    BiKhoa?: boolean;

    @IsBoolean()
    @IsOptional()
    CanDoiMatKhau?: boolean;

    @IsString()
    @IsOptional()
    MuoiMatKhau?: string;

    @IsString()
    @IsOptional()
    GhiChu?: string;

    @IsBoolean()
    LaNguoiDungHeThong: boolean;

    @IsUUID()
    @IsOptional()
    MaKhoa?: string;
}

export class UpdateUserDto extends CreateUserDto { }

export class UserResponseDto {
    @IsUUID()
    MaNguoiDung: string;

    @IsString()
    TenDangNhap: string;

    @IsEmail()
    Email: string;

    @IsString()
    HoTen: string;

    @IsDate()
    NgayTao: Date;

    @IsBoolean()
    DaXoa: boolean;

    @IsBoolean()
    BiKhoa: boolean;

    @IsBoolean()
    CanDoiMatKhau: boolean;

    @IsDate()
    @IsOptional()
    NgayHoatDongCuoi?: Date;

    @IsDate()
    @IsOptional()
    NgayDangNhapCuoi?: Date;

    @IsDate()
    @IsOptional()
    NgayDoiMatKhauCuoi?: Date;

    @IsDate()
    @IsOptional()
    NgayKhoaCuoi?: Date;

    @IsOptional()
    SoLanNhapSaiMatKhau?: number;

    @IsDate()
    @IsOptional()
    BatDauKhoangThoiGianNhapSai?: Date;

    @IsOptional()
    SoLanTraLoiSai?: number;

    @IsDate()
    @IsOptional()
    BatDauKhoangThoiGianTraLoiSai?: Date;

    @IsString()
    @IsOptional()
    MuoiMatKhau?: string;

    @IsString()
    @IsOptional()
    GhiChu?: string;

    @IsBoolean()
    LaNguoiDungHeThong: boolean;

    @IsUUID()
    @IsOptional()
    MaKhoa?: string;

    @IsOptional()
    Khoa?: any;
}
