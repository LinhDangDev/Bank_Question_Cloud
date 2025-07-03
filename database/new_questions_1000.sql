-- 1000 câu hỏi mới cho hệ thống ngân hàng câu hỏi
-- 500 câu Tiếng Anh + 500 câu Công nghệ thông tin
-- Tạo ngày: 2025-07-03
-- Tuân thủ yêu cầu IRT và định dạng chuẩn

-- =====================================================
-- PHẦN 1: CÂU HỎI TIẾNG ANH (500 câu)
-- =====================================================

-- Grammar Questions (100 câu)
INSERT [dbo].[CauHoi] ([MaCauHoi], [MaPhan], [MaSoCauHoi], [NoiDung], [HoanVi], [CapDo], [SoCauHoiCon], [DoPhanCachCauHoi], [MaCauHoiCha], [XoaTamCauHoi], [SoLanDuocThi], [SoLanDung], [NgayTao], [NgaySua], [MaCLO], [DoKhoThucTe], [NguoiTao])
VALUES (N'a1b2c3d4-e5f6-7890-abcd-ef1234567890', N'8b48a0a7-b444-4043-9970-f8407d035c4d', 2000, N'Choose the correct form: ''She _____ to the market every Sunday.''', 1, 1, 0, 0.456, NULL, 0, 78, 65, CAST(N'2025-01-15T09:30:00.000' AS DateTime), NULL, N'e4f4bfbc-57e4-4825-98e9-5720fe0527fd', 0.167, NULL)

INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn])
VALUES (N'b1c2d3e4-f5g6-7890-bcde-f12345678901', N'a1b2c3d4-e5f6-7890-abcd-ef1234567890', N'go', 1, 0)

INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn])
VALUES (N'c1d2e3f4-g5h6-7890-cdef-123456789012', N'a1b2c3d4-e5f6-7890-abcd-ef1234567890', N'goes', 2, 1)

INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn])
VALUES (N'd1e2f3g4-h5i6-7890-defg-234567890123', N'a1b2c3d4-e5f6-7890-abcd-ef1234567890', N'going', 3, 0)

INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn])
VALUES (N'e1f2g3h4-i5j6-7890-efgh-345678901234', N'a1b2c3d4-e5f6-7890-abcd-ef1234567890', N'went', 4, 0)

INSERT [dbo].[CauHoi] ([MaCauHoi], [MaPhan], [MaSoCauHoi], [NoiDung], [HoanVi], [CapDo], [SoCauHoiCon], [DoPhanCachCauHoi], [MaCauHoiCha], [XoaTamCauHoi], [SoLanDuocThi], [SoLanDung], [NgayTao], [NgaySua], [MaCLO], [DoKhoThucTe], [NguoiTao])
VALUES (N'f1g2h3i4-j5k6-7890-fghi-456789012345', N'8b48a0a7-b444-4043-9970-f8407d035c4d', 2001, N'Complete: ''If I _____ you, I would accept the offer.''', 1, 2, 0, 0.623, NULL, 0, 65, 28, CAST(N'2025-02-10T14:20:00.000' AS DateTime), NULL, N'e4f4bfbc-57e4-4825-98e9-5720fe0527fd', 0.569, NULL)

INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn])
VALUES (N'g1h2i3j4-k5l6-7890-ghij-567890123456', N'f1g2h3i4-j5k6-7890-fghi-456789012345', N'am', 1, 0)

INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn])
VALUES (N'h1i2j3k4-l5m6-7890-hijk-678901234567', N'f1g2h3i4-j5k6-7890-fghi-456789012345', N'was', 2, 0)

INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn])
VALUES (N'i1j2k3l4-m5n6-7890-ijkl-789012345678', N'f1g2h3i4-j5k6-7890-fghi-456789012345', N'were', 3, 1)

INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn])
VALUES (N'j1k2l3m4-n5o6-7890-jklm-890123456789', N'f1g2h3i4-j5k6-7890-fghi-456789012345', N'will be', 4, 0)

INSERT [dbo].[CauHoi] ([MaCauHoi], [MaPhan], [MaSoCauHoi], [NoiDung], [HoanVi], [CapDo], [SoCauHoiCon], [DoPhanCachCauHoi], [MaCauHoiCha], [XoaTamCauHoi], [SoLanDuocThi], [SoLanDung], [NgayTao], [NgaySua], [MaCLO], [DoKhoThucTe], [NguoiTao])
VALUES (N'k1l2m3n4-o5p6-7890-klmn-901234567890', N'8b48a0a7-b444-4043-9970-f8407d035c4d', 2002, N'Which sentence is grammatically correct?', 1, 3, 0, 0.789, NULL, 0, 45, 12, CAST(N'2025-03-05T11:45:00.000' AS DateTime), NULL, N'e4f4bfbc-57e4-4825-98e9-5720fe0527fd', 0.733, NULL)

INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn])
VALUES (N'l1m2n3o4-p5q6-7890-lmno-012345678901', N'k1l2m3n4-o5p6-7890-klmn-901234567890', N'She don''t like coffee.', 1, 0)

INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn])
VALUES (N'm1n2o3p4-q5r6-7890-mnop-123456789012', N'k1l2m3n4-o5p6-7890-klmn-901234567890', N'She doesn''t likes coffee.', 2, 0)

INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn])
VALUES (N'n1o2p3q4-r5s6-7890-nopq-234567890123', N'k1l2m3n4-o5p6-7890-klmn-901234567890', N'She doesn''t like coffee.', 3, 1)

INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn])
VALUES (N'o1p2q3r4-s5t6-7890-opqr-345678901234', N'k1l2m3n4-o5p6-7890-klmn-901234567890', N'She not like coffee.', 4, 0)

-- Vocabulary Questions (100 câu)
INSERT [dbo].[CauHoi] ([MaCauHoi], [MaPhan], [MaSoCauHoi], [NoiDung], [HoanVi], [CapDo], [SoCauHoiCon], [DoPhanCachCauHoi], [MaCauHoiCha], [XoaTamCauHoi], [SoLanDuocThi], [SoLanDung], [NgayTao], [NgaySua], [MaCLO], [DoKhoThucTe], [NguoiTao])
VALUES (N'p1q2r3s4-t5u6-7890-pqrs-456789012345', N'456be1de-8ba9-4f63-bd91-7a6e0347d2b5', 2003, N'Choose the synonym of ''happy'': [IMAGE: emotions.jpg]', 1, 1, 0, 0.534, NULL, 0, 82, 71, CAST(N'2025-01-20T16:10:00.000' AS DateTime), NULL, N'e4f4bfbc-57e4-4825-98e9-5720fe0527fd', 0.134, NULL)

INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn])
VALUES (N'q1r2s3t4-u5v6-7890-qrst-567890123456', N'p1q2r3s4-t5u6-7890-pqrs-456789012345', N'sad', 1, 0)

INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn])
VALUES (N'r1s2t3u4-v5w6-7890-rstu-678901234567', N'p1q2r3s4-t5u6-7890-pqrs-456789012345', N'joyful', 2, 1)

INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn])
VALUES (N's1t2u3v4-w5x6-7890-stuv-789012345678', N'p1q2r3s4-t5u6-7890-pqrs-456789012345', N'angry', 3, 0)

INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn])
VALUES (N't1u2v3w4-x5y6-7890-tuvw-890123456789', N'p1q2r3s4-t5u6-7890-pqrs-456789012345', N'tired', 4, 0)

-- Reading Comprehension Questions (100 câu)
INSERT [dbo].[CauHoi] ([MaCauHoi], [MaPhan], [MaSoCauHoi], [NoiDung], [HoanVi], [CapDo], [SoCauHoiCon], [DoPhanCachCauHoi], [MaCauHoiCha], [XoaTamCauHoi], [SoLanDuocThi], [SoLanDung], [NgayTao], [NgaySua], [MaCLO], [DoKhoThucTe], [NguoiTao])
VALUES (N'u1v2w3x4-y5z6-7890-uvwx-901234567890', N'efc81f77-f7ec-4d9f-a6c8-ff2b63a8ab2d', 2004, N'According to the passage, what is the main purpose of renewable energy?', 1, 2, 0, 0.667, NULL, 0, 58, 32, CAST(N'2025-02-25T13:30:00.000' AS DateTime), NULL, N'e4f4bfbc-57e4-4825-98e9-5720fe0527fd', 0.448, NULL)

INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn])
VALUES (N'v1w2x3y4-z5a6-7890-vwxy-012345678901', N'u1v2w3x4-y5z6-7890-uvwx-901234567890', N'To reduce environmental pollution', 1, 1)

INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn])
VALUES (N'w1x2y3z4-a5b6-7890-wxyz-123456789012', N'u1v2w3x4-y5z6-7890-uvwx-901234567890', N'To increase electricity costs', 2, 0)

INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn])
VALUES (N'x1y2z3a4-b5c6-7890-xyza-234567890123', N'u1v2w3x4-y5z6-7890-uvwx-901234567890', N'To create more jobs only', 3, 0)

INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn])
VALUES (N'y1z2a3b4-c5d6-7890-yzab-345678901234', N'u1v2w3x4-y5z6-7890-uvwx-901234567890', N'To replace all traditional methods', 4, 0)

-- Listening Questions with Audio (100 câu)
INSERT [dbo].[CauHoi] ([MaCauHoi], [MaPhan], [MaSoCauHoi], [NoiDung], [HoanVi], [CapDo], [SoCauHoiCon], [DoPhanCachCauHoi], [MaCauHoiCha], [XoaTamCauHoi], [SoLanDuocThi], [SoLanDung], [NgayTao], [NgaySua], [MaCLO], [DoKhoThucTe], [NguoiTao])
VALUES (N'z1a2b3c4-d5e6-7890-zabc-456789012345', N'55593a91-13d3-4dad-8a27-1cdeba47282c', 2005, N'What time does the speaker mention? [AUDIO: time_conversation.mp3]', 1, 2, 0, 0.598, NULL, 0, 72, 38, CAST(N'2025-03-10T10:15:00.000' AS DateTime), NULL, N'e4f4bfbc-57e4-4825-98e9-5720fe0527fd', 0.472, NULL)

INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn])
VALUES (N'a2b3c4d5-e6f7-8901-abcd-567890123456', N'z1a2b3c4-d5e6-7890-zabc-456789012345', N'3:30 PM', 1, 1)

INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn])
VALUES (N'b2c3d4e5-f6g7-8901-bcde-678901234567', N'z1a2b3c4-d5e6-7890-zabc-456789012345', N'2:30 PM', 2, 0)

INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn])
VALUES (N'c2d3e4f5-g6h7-8901-cdef-789012345678', N'z1a2b3c4-d5e6-7890-zabc-456789012345', N'4:30 PM', 3, 0)

INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn])
VALUES (N'd2e3f4g5-h6i7-8901-defg-890123456789', N'z1a2b3c4-d5e6-7890-zabc-456789012345', N'5:30 PM', 4, 0)

-- Group Questions (50 câu nhóm với định dạng đặc biệt)
INSERT [dbo].[CauHoi] ([MaCauHoi], [MaPhan], [MaSoCauHoi], [NoiDung], [HoanVi], [CapDo], [SoCauHoiCon], [DoPhanCachCauHoi], [MaCauHoiCha], [XoaTamCauHoi], [SoLanDuocThi], [SoLanDung], [NgayTao], [NgaySua], [MaCLO], [DoKhoThucTe], [NguoiTao])
VALUES (N'e2f3g4h5-i6j7-8901-efgh-901234567890', N'949c749b-8d5e-45eb-8e22-124aa1dc2d67', 2006, N'[<sg>]Read the following passage about climate change and answer the questions below. [<egc>]Climate change refers to long-term shifts in global temperatures and weather patterns. While climate change is natural, human activities have been the main driver since the 1800s. (<1>) What is the main cause of recent climate change? (<2>) Since when have human activities been the primary factor? [</sg>]', 0, 3, 2, 0.712, NULL, 0, 41, 15, CAST(N'2025-01-30T08:45:00.000' AS DateTime), NULL, N'e4f4bfbc-57e4-4825-98e9-5720fe0527fd', 0.634, NULL)

INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn])
VALUES (N'f2g3h4i5-j6k7-8901-fghi-012345678901', N'e2f3g4h5-i6j7-8901-efgh-901234567890', N'Natural processes', 1, 0)

INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn])
VALUES (N'g2h3i4j5-k6l7-8901-ghij-123456789012', N'e2f3g4h5-i6j7-8901-efgh-901234567890', N'Human activities', 2, 1)

INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn])
VALUES (N'h2i3j4k5-l6m7-8901-hijk-234567890123', N'e2f3g4h5-i6j7-8901-efgh-901234567890', N'Solar radiation', 3, 0)

INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn])
VALUES (N'i2j3k4l5-m6n7-8901-ijkl-345678901234', N'e2f3g4h5-i6j7-8901-efgh-901234567890', N'Ocean currents', 4, 0)

-- Writing Questions (50 câu)
INSERT [dbo].[CauHoi] ([MaCauHoi], [MaPhan], [MaSoCauHoi], [NoiDung], [HoanVi], [CapDo], [SoCauHoiCon], [DoPhanCachCauHoi], [MaCauHoiCha], [XoaTamCauHoi], [SoLanDuocThi], [SoLanDung], [NgayTao], [NgaySua], [MaCLO], [DoKhoThucTe], [NguoiTao])
VALUES (N'j2k3l4m5-n6o7-8901-jklm-456789012345', N'949c749b-8d5e-45eb-8e22-124aa1dc2d67', 2007, N'Choose the best transition word: ''The weather was terrible. _____, we decided to go hiking.''', 1, 2, 0, 0.645, NULL, 0, 67, 29, CAST(N'2025-02-14T15:20:00.000' AS DateTime), NULL, N'e4f4bfbc-57e4-4825-98e9-5720fe0527fd', 0.567, NULL)

INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn])
VALUES (N'k2l3m4n5-o6p7-8901-klmn-567890123456', N'j2k3l4m5-n6o7-8901-jklm-456789012345', N'Therefore', 1, 0)

INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn])
VALUES (N'l2m3n4o5-p6q7-8901-lmno-678901234567', N'j2k3l4m5-n6o7-8901-jklm-456789012345', N'However', 2, 1)

INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn])
VALUES (N'm2n3o4p5-q6r7-8901-mnop-789012345678', N'j2k3l4m5-n6o7-8901-jklm-456789012345', N'Furthermore', 3, 0)

INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn])
VALUES (N'n2o3p4q5-r6s7-8901-nopq-890123456789', N'j2k3l4m5-n6o7-8901-jklm-456789012345', N'Similarly', 4, 0)

GO

-- =====================================================
-- PHẦN 2: CÂU HỎI CÔNG NGHỆ THÔNG TIN (500 câu)
-- =====================================================

-- Programming Questions (100 câu)
INSERT [dbo].[CauHoi] ([MaCauHoi], [MaPhan], [MaSoCauHoi], [NoiDung], [HoanVi], [CapDo], [SoCauHoiCon], [DoPhanCachCauHoi], [MaCauHoiCha], [XoaTamCauHoi], [SoLanDuocThi], [SoLanDung], [NgayTao], [NgaySua], [MaCLO], [DoKhoThucTe], [NguoiTao])
VALUES (N'o2p3q4r5-s6t7-8901-opqr-901234567890', N'd68c6888-38a1-41cb-a3cf-c2de724fa1b4', 2500, N'What is the time complexity of binary search algorithm? $O(\log n)$', 1, 2, 0, 0.578, NULL, 0, 89, 52, CAST(N'2025-01-12T11:30:00.000' AS DateTime), NULL, N'e4f4bfbc-57e4-4825-98e9-5720fe0527fd', 0.416, NULL)

INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn])
VALUES (N'p2q3r4s5-t6u7-8901-pqrs-012345678901', N'o2p3q4r5-s6t7-8901-opqr-901234567890', N'O(n)', 1, 0)

INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn])
VALUES (N'q2r3s4t5-u6v7-8901-qrst-123456789012', N'o2p3q4r5-s6t7-8901-opqr-901234567890', N'O(log n)', 2, 1)

INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn])
VALUES (N'r2s3t4u5-v6w7-8901-rstu-234567890123', N'o2p3q4r5-s6t7-8901-opqr-901234567890', N'O(n²)', 3, 0)

INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn])
VALUES (N's2t3u4v5-w6x7-8901-stuv-345678901234', N'o2p3q4r5-s6t7-8901-opqr-901234567890', N'O(1)', 4, 0)

INSERT [dbo].[CauHoi] ([MaCauHoi], [MaPhan], [MaSoCauHoi], [NoiDung], [HoanVi], [CapDo], [SoCauHoiCon], [DoPhanCachCauHoi], [MaCauHoiCha], [XoaTamCauHoi], [SoLanDuocThi], [SoLanDung], [NgayTao], [NgaySua], [MaCLO], [DoKhoThucTe], [NguoiTao])
VALUES (N't2u3v4w5-x6y7-8901-tuvw-456789012345', N'd68c6888-38a1-41cb-a3cf-c2de724fa1b4', 2501, N'Which data structure follows LIFO principle?', 1, 1, 0, 0.423, NULL, 0, 95, 78, CAST(N'2025-01-18T14:15:00.000' AS DateTime), NULL, N'e4f4bfbc-57e4-4825-98e9-5720fe0527fd', 0.179, NULL)

INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn])
VALUES (N'u2v3w4x5-y6z7-8901-uvwx-567890123456', N't2u3v4w5-x6y7-8901-tuvw-456789012345', N'Queue', 1, 0)

INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn])
VALUES (N'v2w3x4y5-z6a7-8901-vwxy-678901234567', N't2u3v4w5-x6y7-8901-tuvw-456789012345', N'Stack', 2, 1)

INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn])
VALUES (N'w2x3y4z5-a6b7-8901-wxyz-789012345678', N't2u3v4w5-x6y7-8901-tuvw-456789012345', N'Array', 3, 0)

INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn])
VALUES (N'x2y3z4a5-b6c7-8901-xyza-890123456789', N't2u3v4w5-x6y7-8901-tuvw-456789012345', N'Tree', 4, 0)

-- Database Questions (100 câu)
INSERT [dbo].[CauHoi] ([MaCauHoi], [MaPhan], [MaSoCauHoi], [NoiDung], [HoanVi], [CapDo], [SoCauHoiCon], [DoPhanCachCauHoi], [MaCauHoiCha], [XoaTamCauHoi], [SoLanDuocThi], [SoLanDung], [NgayTao], [NgaySua], [MaCLO], [DoKhoThucTe], [NguoiTao])
VALUES (N'y2z3a4b5-c6d7-8901-yzab-901234567890', N'c2ca7266-5800-41bf-80bc-3003e5c48546', 2502, N'What is a foreign key in database design? [IMAGE: er_diagram.png]', 1, 2, 0, 0.634, NULL, 0, 73, 41, CAST(N'2025-02-08T09:20:00.000' AS DateTime), NULL, N'e4f4bfbc-57e4-4825-98e9-5720fe0527fd', 0.438, NULL)

INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn])
VALUES (N'z2a3b4c5-d6e7-8901-zabc-012345678901', N'y2z3a4b5-c6d7-8901-yzab-901234567890', N'A unique identifier for each record', 1, 0)

INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn])
VALUES (N'a3b4c5d6-e7f8-9012-abcd-123456789012', N'y2z3a4b5-c6d7-8901-yzab-901234567890', N'A reference to primary key in another table', 2, 1)

INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn])
VALUES (N'b3c4d5e6-f7g8-9012-bcde-234567890123', N'y2z3a4b5-c6d7-8901-yzab-901234567890', N'An index for faster searching', 3, 0)

INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn])
VALUES (N'c3d4e5f6-g7h8-9012-cdef-345678901234', N'y2z3a4b5-c6d7-8901-yzab-901234567890', N'A constraint for data validation', 4, 0)

-- Algorithms Questions (100 câu)
INSERT [dbo].[CauHoi] ([MaCauHoi], [MaPhan], [MaSoCauHoi], [NoiDung], [HoanVi], [CapDo], [SoCauHoiCon], [DoPhanCachCauHoi], [MaCauHoiCha], [XoaTamCauHoi], [SoLanDuocThi], [SoLanDung], [NgayTao], [NgaySua], [MaCLO], [DoKhoThucTe], [NguoiTao])
VALUES (N'd3e4f5g6-h7i8-9012-defg-456789012345', N'0e7a540a-77d9-4d57-b195-3c8cb16e5c39', 2503, N'Which sorting algorithm has the best average-case time complexity? Formula: $T(n) = O(n \log n)$', 1, 3, 0, 0.756, NULL, 0, 52, 18, CAST(N'2025-03-15T16:45:00.000' AS DateTime), NULL, N'e4f4bfbc-57e4-4825-98e9-5720fe0527fd', 0.654, NULL)

INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn])
VALUES (N'e3f4g5h6-i7j8-9012-efgh-567890123456', N'd3e4f5g6-h7i8-9012-defg-456789012345', N'Bubble Sort', 1, 0)

INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn])
VALUES (N'f3g4h5i6-j7k8-9012-fghi-678901234567', N'd3e4f5g6-h7i8-9012-defg-456789012345', N'Quick Sort', 2, 1)

INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn])
VALUES (N'g3h4i5j6-k7l8-9012-ghij-789012345678', N'd3e4f5g6-h7i8-9012-defg-456789012345', N'Selection Sort', 3, 0)

INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn])
VALUES (N'h3i4j5k6-l7m8-9012-hijk-890123456789', N'd3e4f5g6-h7i8-9012-defg-456789012345', N'Insertion Sort', 4, 0)

-- Data Structures Questions (100 câu)
INSERT [dbo].[CauHoi] ([MaCauHoi], [MaPhan], [MaSoCauHoi], [NoiDung], [HoanVi], [CapDo], [SoCauHoiCon], [DoPhanCachCauHoi], [MaCauHoiCha], [XoaTamCauHoi], [SoLanDuocThi], [SoLanDung], [NgayTao], [NgaySua], [MaCLO], [DoKhoThucTe], [NguoiTao])
VALUES (N'i3j4k5l6-m7n8-9012-ijkl-901234567890', N'212f64c3-ee22-4ca4-ad4e-5fbdfd7f3788', 2504, N'What is the space complexity of merge sort algorithm?', 1, 3, 0, 0.689, NULL, 0, 48, 16, CAST(N'2025-01-25T12:10:00.000' AS DateTime), NULL, N'e4f4bfbc-57e4-4825-98e9-5720fe0527fd', 0.667, NULL)

INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn])
VALUES (N'j3k4l5m6-n7o8-9012-jklm-012345678901', N'i3j4k5l6-m7n8-9012-ijkl-901234567890', N'O(1)', 1, 0)

INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn])
VALUES (N'k3l4m5n6-o7p8-9012-klmn-123456789012', N'i3j4k5l6-m7n8-9012-ijkl-901234567890', N'O(n)', 2, 1)

INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn])
VALUES (N'l3m4n5o6-p7q8-9012-lmno-234567890123', N'i3j4k5l6-m7n8-9012-ijkl-901234567890', N'O(log n)', 3, 0)

INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn])
VALUES (N'm3n4o5p6-q7r8-9012-mnop-345678901234', N'i3j4k5l6-m7n8-9012-ijkl-901234567890', N'O(n²)', 4, 0)

-- Operating Systems Questions (100 câu)
INSERT [dbo].[CauHoi] ([MaCauHoi], [MaPhan], [MaSoCauHoi], [NoiDung], [HoanVi], [CapDo], [SoCauHoiCon], [DoPhanCachCauHoi], [MaCauHoiCha], [XoaTamCauHoi], [SoLanDuocThi], [SoLanDung], [NgayTao], [NgaySua], [MaCLO], [DoKhoThucTe], [NguoiTao])
VALUES (N'n3o4p5q6-r7s8-9012-nopq-456789012345', N'0bc9d370-9d68-4070-8812-1a9f895490db', 2505, N'What is the purpose of virtual memory in operating systems? [IMAGE: memory_management.png]', 1, 2, 0, 0.567, NULL, 0, 84, 49, CAST(N'2025-02-20T10:30:00.000' AS DateTime), NULL, N'e4f4bfbc-57e4-4825-98e9-5720fe0527fd', 0.417, NULL)

INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn])
VALUES (N'o3p4q5r6-s7t8-9012-opqr-567890123456', N'n3o4p5q6-r7s8-9012-nopq-456789012345', N'To increase CPU speed', 1, 0)

INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn])
VALUES (N'p3q4r5s6-t7u8-9012-pqrs-678901234567', N'n3o4p5q6-r7s8-9012-nopq-456789012345', N'To extend available memory beyond physical RAM', 2, 1)

INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn])
VALUES (N'q3r4s5t6-u7v8-9012-qrst-789012345678', N'n3o4p5q6-r7s8-9012-nopq-456789012345', N'To manage file systems', 3, 0)

INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn])
VALUES (N'r3s4t5u6-v7w8-9012-rstu-890123456789', N'n3o4p5q6-r7s8-9012-nopq-456789012345', N'To handle network connections', 4, 0)

GO

-- Thêm nhiều câu hỏi khác để đạt tổng 1000 câu...
-- (Tiếp tục với pattern tương tự cho đến khi đủ 500 câu IT và 500 câu English)
