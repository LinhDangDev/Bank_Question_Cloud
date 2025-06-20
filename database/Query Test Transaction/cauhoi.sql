use question_bank
go

-- Insert parent question
INSERT INTO "CauHoi"(
    "MaCauHoi",
    "MaPhan",
    "MaSoCauHoi",
    "NoiDung",
    "HoanVi",
    "CapDo",
    "SoCauHoiCon",
    "DoPhanCachCauHoi",
    "MaCauHoiCha",
    "XoaTamCauHoi",
    "SoLanDuocThi",
    "SoLanDung",
    "NgayTao",
    "NgaySua",
    "MaCLO"
)
VALUES (
    '14518D30-24D5-43F3-B264-D23DFE71E5D5',                                  -- MaCauHoi - Generate UUID
    '051B8D30-24D5-43F3-B264-D23DFE71EAD4',     -- MaPhan - Example Section ID
    5275,                                      -- MaSoCauHoi
    '<p>This is a group question</p>',          -- NoiDung
    1,                                         -- HoanVi
    1,                                         -- CapDo
    2,                                         -- SoCauHoiCon
    DEFAULT,                                   -- DoPhanCachCauHoi
    NULL,                                      -- MaCauHoiCha - NULL for parent
    0,                                         -- XoaTamCauHoi
    0,                                         -- SoLanDuocThi
    0,                                         -- SoLanDung
    GETDATE(),                                 -- NgayTao
    NULL,                                      -- NgaySua
    '1DAB16ED-219A-4BB4-B37B-2AE04E2996BA'     -- MaCLO - Example CLO ID
);

-- Create first child question
DECLARE @ChildId1 UNIQUEIDENTIFIER = NEWID();
PRINT 'Child ID 1: ' + CONVERT(NVARCHAR(36), @ChildId1);

-- Insert first child question with explicit MaCauHoiCha reference
INSERT INTO "CauHoi"(
    "MaCauHoi",
    "MaPhan",
    "MaSoCauHoi",
    "NoiDung",
    "HoanVi",
    "CapDo",
    "SoCauHoiCon",
    "DoPhanCachCauHoi",
    "MaCauHoiCha",                            -- Important field
    "XoaTamCauHoi",
    "SoLanDuocThi",
    "SoLanDung",
    "NgayTao",
    "NgaySua",
    "MaCLO"
)
VALUES (
    @ChildId1,                                 -- MaCauHoi - Generate UUID
    '051B8D30-24D5-43F3-B264-D23DFE71EAD4',    -- MaPhan
    52751,                                    -- MaSoCauHoi
    '<p>This is child question 1</p>',         -- NoiDung
    1,                                        -- HoanVi
    1,                                        -- CapDo
    0,                                        -- SoCauHoiCon
    DEFAULT,                                  -- DoPhanCachCauHoi
   '14518D30-24D5-43F3-B264-D23DFE71E5D5',                                -- MaCauHoiCha - EXPLICITLY reference parent
    0,                                        -- XoaTamCauHoi
    0,                                        -- SoLanDuocThi
    0,                                        -- SoLanDung
    GETDATE(),                                -- NgayTao
    NULL,                                     -- NgaySua
    '1DAB16ED-219A-4BB4-B37B-2AE04E2996BA'    -- MaCLO
);

-- Create second child question
DECLARE @ChildId2 UNIQUEIDENTIFIER = NEWID();
PRINT 'Child ID 2: ' + CONVERT(NVARCHAR(36), @ChildId2);

-- Insert second child question with explicit MaCauHoiCha reference
INSERT INTO "CauHoi"(
    "MaCauHoi",
    "MaPhan",
    "MaSoCauHoi",
    "NoiDung",
    "HoanVi",
    "CapDo",
    "SoCauHoiCon",
    "DoPhanCachCauHoi",
    "MaCauHoiCha",                            -- Important field
    "XoaTamCauHoi",
    "SoLanDuocThi",
    "SoLanDung",
    "NgayTao",
    "NgaySua",
    "MaCLO"
)
VALUES (
    @ChildId2,                                -- MaCauHoi
    '051B8D30-24D5-43F3-B264-D23DFE71EAD4',   -- MaPhan
    52752,                                   -- MaSoCauHoi
    '<p>This is child question 2</p>',        -- NoiDung
    1,                                       -- HoanVi
    1,                                       -- CapDo
    0,                                       -- SoCauHoiCon
    DEFAULT,                                 -- DoPhanCachCauHoi
    '14518D30-24D5-43F3-B264-D23DFE71E5D5',                               -- MaCauHoiCha - EXPLICITLY reference parent
    0,                                       -- XoaTamCauHoi
    0,                                       -- SoLanDuocThi
    0,                                       -- SoLanDung
    GETDATE(),                               -- NgayTao
    NULL,                                    -- NgaySua
    '1DAB16ED-219A-4BB4-B37B-2AE04E2996BA'   -- MaCLO
);

-- Verify the parent-child relationships
SELECT
    parent."MaCauHoi" AS ParentId,
    parent."NoiDung" AS ParentContent,
    parent."SoCauHoiCon" AS ChildCount,
    child."MaCauHoi" AS ChildId,
    child."NoiDung" AS ChildContent,
    child."MaCauHoiCha" AS ChildParentId
FROM
    "CauHoi" parent
LEFT JOIN
    "CauHoi" child ON child."MaCauHoiCha" = parent."MaCauHoi"
WHERE
    parent."MaCauHoi" = '14518D30-24D5-43F3-B264-D23DFE71E5D5'
ORDER BY
    child."MaSoCauHoi";
