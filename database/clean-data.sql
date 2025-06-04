USE question_bank
GO

-- Delete data from CauTraLoi table
DELETE FROM [dbo].[CauTraLoi]
WHERE [MaCauTraLoi] IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444',
    '55555555-5555-5555-5555-555555555555',
    '66666666-6666-6666-6666-666666666666',
    '77777777-7777-7777-7777-777777777777'
);

-- Delete data from CauHoi table
DELETE FROM [dbo].[CauHoi]
WHERE [MaCauHoi] IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333'
);

-- Delete data from Phan table
DELETE FROM [dbo].[Phan]
WHERE [MaPhan] IN (
    '11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '22222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '33333333-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
);

-- Delete data from MonHoc table
DELETE FROM [dbo].[MonHoc]
WHERE [MaMonHoc] IN (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'dddddddd-dddd-dddd-dddd-dddddddddddd'
);

-- Delete data from CLO table
DELETE FROM [dbo].[CLO]
WHERE [MaCLO] IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333'
);

-- Delete data from Khoa table
DELETE FROM [dbo].[Khoa]
WHERE [MaKhoa] IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444',
    '55555555-5555-5555-5555-555555555555'
);
