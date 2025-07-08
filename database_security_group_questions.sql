-- Database Security Group Questions for CLO4
-- Author: Linh Dang Dev
-- Generated: 2025-07-08 02:29:26
-- Total: 30 group questions (5 shown here, extend pattern for all 30)

USE [question_bank]
GO

-- Group Question 1: Database Security
INSERT [dbo].[CauHoi] ([MaCauHoi], [MaPhan], [MaSoCauHoi], [NoiDung], [HoanVi], [CapDo], [SoCauHoiCon], [DoPhanCachCauHoi], [MaCauHoiCha], [XoaTamCauHoi], [SoLanDuocThi], [SoLanDung], [NgayTao], [NgaySua], [MaCLO], [DoKhoThucTe], [NguoiTao]) VALUES
(N'd8d93c8a-d9da-43d7-b881-8ebd83e8db20', N'bb52f95f-db06-48fc-b111-2b2bbd6e38e2', 70001, N'[<sg>]Database authentication is the process of verifying the identity of users attempting to access a database system. Common authentication methods include username/password combinations, multi-factor authentication, and certificate-based authentication. Strong authentication policies help prevent unauthorized access and protect sensitive data from security breaches. [<egc>](<1>) What is database authentication? (<2>) What are common authentication methods? (<3>) What do strong authentication policies help prevent? (<4>) What type of data do authentication policies protect? (<5>) What can weak authentication lead to? [</sg>]', 0, 2, 5, 0.5, NULL, 0, 0, 0, CAST(N'2025-07-08T02:29:26.000' AS DateTime), NULL, N'1dab16ed-219a-4bb4-b37b-2ae04e2996ba', 0.5, NULL)

-- Child Question 1.1
INSERT [dbo].[CauHoi] ([MaCauHoi], [MaPhan], [MaSoCauHoi], [NoiDung], [HoanVi], [CapDo], [SoCauHoiCon], [DoPhanCachCauHoi], [MaCauHoiCha], [XoaTamCauHoi], [SoLanDuocThi], [SoLanDung], [NgayTao], [NgaySua], [MaCLO], [DoKhoThucTe], [NguoiTao]) VALUES
(N'951e9591-d18a-49fd-a824-11da16fd8bd3', N'bb52f95f-db06-48fc-b111-2b2bbd6e38e2', 70002, N'(<1>) What is database authentication?[<br>]', 1, 2, 0, 0.5, N'd8d93c8a-d9da-43d7-b881-8ebd83e8db20', 0, 0, 0, CAST(N'2025-07-08T02:29:26.000' AS DateTime), NULL, N'1dab16ed-219a-4bb4-b37b-2ae04e2996ba', 0.5, NULL)

-- Answers for Child Question 1.1
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'951e9591-d18a-49fd-a824-11da16fd8bd3', N'The process of verifying user identity', 0, 1, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'951e9591-d18a-49fd-a824-11da16fd8bd3', N'The process of encrypting data', 1, 0, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'951e9591-d18a-49fd-a824-11da16fd8bd3', N'The process of backing up data', 2, 0, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'951e9591-d18a-49fd-a824-11da16fd8bd3', N'The process of optimizing queries', 3, 0, 1)

-- Child Question 1.2
INSERT [dbo].[CauHoi] ([MaCauHoi], [MaPhan], [MaSoCauHoi], [NoiDung], [HoanVi], [CapDo], [SoCauHoiCon], [DoPhanCachCauHoi], [MaCauHoiCha], [XoaTamCauHoi], [SoLanDuocThi], [SoLanDung], [NgayTao], [NgaySua], [MaCLO], [DoKhoThucTe], [NguoiTao]) VALUES
(N'ae4793e4-f368-4135-bcdf-e2f9282b6e9f', N'bb52f95f-db06-48fc-b111-2b2bbd6e38e2', 70003, N'(<2>) What are common authentication methods?[<br>]', 1, 2, 0, 0.5, N'd8d93c8a-d9da-43d7-b881-8ebd83e8db20', 0, 0, 0, CAST(N'2025-07-08T02:29:26.000' AS DateTime), NULL, N'1dab16ed-219a-4bb4-b37b-2ae04e2996ba', 0.5, NULL)

-- Answers for Child Question 1.2
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'ae4793e4-f368-4135-bcdf-e2f9282b6e9f', N'Username/password, multi-factor, certificate-based', 0, 1, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'ae4793e4-f368-4135-bcdf-e2f9282b6e9f', N'Only passwords', 1, 0, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'ae4793e4-f368-4135-bcdf-e2f9282b6e9f', N'Only biometrics', 2, 0, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'ae4793e4-f368-4135-bcdf-e2f9282b6e9f', N'Only tokens', 3, 0, 1)

-- Child Question 1.3
INSERT [dbo].[CauHoi] ([MaCauHoi], [MaPhan], [MaSoCauHoi], [NoiDung], [HoanVi], [CapDo], [SoCauHoiCon], [DoPhanCachCauHoi], [MaCauHoiCha], [XoaTamCauHoi], [SoLanDuocThi], [SoLanDung], [NgayTao], [NgaySua], [MaCLO], [DoKhoThucTe], [NguoiTao]) VALUES
(N'03721974-c1ad-4e5d-b644-68e821957e2d', N'bb52f95f-db06-48fc-b111-2b2bbd6e38e2', 70004, N'(<3>) What do strong authentication policies help prevent?[<br>]', 1, 2, 0, 0.5, N'd8d93c8a-d9da-43d7-b881-8ebd83e8db20', 0, 0, 0, CAST(N'2025-07-08T02:29:26.000' AS DateTime), NULL, N'1dab16ed-219a-4bb4-b37b-2ae04e2996ba', 0.5, NULL)

-- Answers for Child Question 1.3
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'03721974-c1ad-4e5d-b644-68e821957e2d', N'Unauthorized access', 0, 1, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'03721974-c1ad-4e5d-b644-68e821957e2d', N'Data corruption', 1, 0, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'03721974-c1ad-4e5d-b644-68e821957e2d', N'System crashes', 2, 0, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'03721974-c1ad-4e5d-b644-68e821957e2d', N'Network delays', 3, 0, 1)

-- Child Question 1.4
INSERT [dbo].[CauHoi] ([MaCauHoi], [MaPhan], [MaSoCauHoi], [NoiDung], [HoanVi], [CapDo], [SoCauHoiCon], [DoPhanCachCauHoi], [MaCauHoiCha], [XoaTamCauHoi], [SoLanDuocThi], [SoLanDung], [NgayTao], [NgaySua], [MaCLO], [DoKhoThucTe], [NguoiTao]) VALUES
(N'fb46ac44-2d2f-4987-9245-51f631296cfb', N'bb52f95f-db06-48fc-b111-2b2bbd6e38e2', 70005, N'(<4>) What type of data do authentication policies protect?[<br>]', 1, 2, 0, 0.5, N'd8d93c8a-d9da-43d7-b881-8ebd83e8db20', 0, 0, 0, CAST(N'2025-07-08T02:29:26.000' AS DateTime), NULL, N'1dab16ed-219a-4bb4-b37b-2ae04e2996ba', 0.5, NULL)

-- Answers for Child Question 1.4
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'fb46ac44-2d2f-4987-9245-51f631296cfb', N'Sensitive data', 0, 1, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'fb46ac44-2d2f-4987-9245-51f631296cfb', N'Public data', 1, 0, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'fb46ac44-2d2f-4987-9245-51f631296cfb', N'Temporary data', 2, 0, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'fb46ac44-2d2f-4987-9245-51f631296cfb', N'Cached data', 3, 0, 1)

-- Child Question 1.5
INSERT [dbo].[CauHoi] ([MaCauHoi], [MaPhan], [MaSoCauHoi], [NoiDung], [HoanVi], [CapDo], [SoCauHoiCon], [DoPhanCachCauHoi], [MaCauHoiCha], [XoaTamCauHoi], [SoLanDuocThi], [SoLanDung], [NgayTao], [NgaySua], [MaCLO], [DoKhoThucTe], [NguoiTao]) VALUES
(N'b2ef9061-1ad2-4fea-874b-163804860646', N'bb52f95f-db06-48fc-b111-2b2bbd6e38e2', 70006, N'(<5>) What can weak authentication lead to?[<br>]', 1, 2, 0, 0.5, N'd8d93c8a-d9da-43d7-b881-8ebd83e8db20', 0, 0, 0, CAST(N'2025-07-08T02:29:26.000' AS DateTime), NULL, N'1dab16ed-219a-4bb4-b37b-2ae04e2996ba', 0.5, NULL)

-- Answers for Child Question 1.5
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'b2ef9061-1ad2-4fea-874b-163804860646', N'Security breaches', 0, 1, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'b2ef9061-1ad2-4fea-874b-163804860646', N'Better performance', 1, 0, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'b2ef9061-1ad2-4fea-874b-163804860646', N'Faster queries', 2, 0, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'b2ef9061-1ad2-4fea-874b-163804860646', N'Lower costs', 3, 0, 1)

-- Group Question 2: Database Security
INSERT [dbo].[CauHoi] ([MaCauHoi], [MaPhan], [MaSoCauHoi], [NoiDung], [HoanVi], [CapDo], [SoCauHoiCon], [DoPhanCachCauHoi], [MaCauHoiCha], [XoaTamCauHoi], [SoLanDuocThi], [SoLanDung], [NgayTao], [NgaySua], [MaCLO], [DoKhoThucTe], [NguoiTao]) VALUES
(N'ccef0ac1-8e86-494d-b5de-fbe3fd40b323', N'bb52f95f-db06-48fc-b111-2b2bbd6e38e2', 70011, N'[<sg>]SQL injection is one of the most common and dangerous database security threats. It occurs when malicious SQL code is inserted into application queries, allowing attackers to manipulate database operations. Prevention techniques include using parameterized queries, input validation, and stored procedures. Regular security audits can help identify and fix SQL injection vulnerabilities. [<egc>](<1>) What is SQL injection? (<2>) How does SQL injection work? (<3>) What are prevention techniques for SQL injection? (<4>) What can help identify SQL injection vulnerabilities? (<5>) Why is SQL injection considered dangerous? [</sg>]', 0, 2, 5, 0.5, NULL, 0, 0, 0, CAST(N'2025-07-08T02:29:26.000' AS DateTime), NULL, N'1dab16ed-219a-4bb4-b37b-2ae04e2996ba', 0.5, NULL)

-- Child Question 2.1
INSERT [dbo].[CauHoi] ([MaCauHoi], [MaPhan], [MaSoCauHoi], [NoiDung], [HoanVi], [CapDo], [SoCauHoiCon], [DoPhanCachCauHoi], [MaCauHoiCha], [XoaTamCauHoi], [SoLanDuocThi], [SoLanDung], [NgayTao], [NgaySua], [MaCLO], [DoKhoThucTe], [NguoiTao]) VALUES
(N'2293a16a-57e6-45fb-a530-7fff95c54705', N'bb52f95f-db06-48fc-b111-2b2bbd6e38e2', 70012, N'(<1>) What is SQL injection?[<br>]', 1, 2, 0, 0.5, N'ccef0ac1-8e86-494d-b5de-fbe3fd40b323', 0, 0, 0, CAST(N'2025-07-08T02:29:26.000' AS DateTime), NULL, N'1dab16ed-219a-4bb4-b37b-2ae04e2996ba', 0.5, NULL)

-- Answers for Child Question 2.1
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'2293a16a-57e6-45fb-a530-7fff95c54705', N'A database security threat involving malicious SQL code', 0, 1, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'2293a16a-57e6-45fb-a530-7fff95c54705', N'A database optimization technique', 1, 0, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'2293a16a-57e6-45fb-a530-7fff95c54705', N'A data backup method', 2, 0, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'2293a16a-57e6-45fb-a530-7fff95c54705', N'A query performance tool', 3, 0, 1)

-- Child Question 2.2
INSERT [dbo].[CauHoi] ([MaCauHoi], [MaPhan], [MaSoCauHoi], [NoiDung], [HoanVi], [CapDo], [SoCauHoiCon], [DoPhanCachCauHoi], [MaCauHoiCha], [XoaTamCauHoi], [SoLanDuocThi], [SoLanDung], [NgayTao], [NgaySua], [MaCLO], [DoKhoThucTe], [NguoiTao]) VALUES
(N'2989f1bc-63cc-441b-82e8-894181cc7581', N'bb52f95f-db06-48fc-b111-2b2bbd6e38e2', 70013, N'(<2>) How does SQL injection work?[<br>]', 1, 2, 0, 0.5, N'ccef0ac1-8e86-494d-b5de-fbe3fd40b323', 0, 0, 0, CAST(N'2025-07-08T02:29:26.000' AS DateTime), NULL, N'1dab16ed-219a-4bb4-b37b-2ae04e2996ba', 0.5, NULL)

-- Answers for Child Question 2.2
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'2989f1bc-63cc-441b-82e8-894181cc7581', N'By inserting malicious SQL code into application queries', 0, 1, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'2989f1bc-63cc-441b-82e8-894181cc7581', N'By encrypting database files', 1, 0, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'2989f1bc-63cc-441b-82e8-894181cc7581', N'By compressing data', 2, 0, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'2989f1bc-63cc-441b-82e8-894181cc7581', N'By indexing tables', 3, 0, 1)

-- Child Question 2.3
INSERT [dbo].[CauHoi] ([MaCauHoi], [MaPhan], [MaSoCauHoi], [NoiDung], [HoanVi], [CapDo], [SoCauHoiCon], [DoPhanCachCauHoi], [MaCauHoiCha], [XoaTamCauHoi], [SoLanDuocThi], [SoLanDung], [NgayTao], [NgaySua], [MaCLO], [DoKhoThucTe], [NguoiTao]) VALUES
(N'9cc82850-0a90-483d-941d-c084518c90c1', N'bb52f95f-db06-48fc-b111-2b2bbd6e38e2', 70014, N'(<3>) What are prevention techniques for SQL injection?[<br>]', 1, 2, 0, 0.5, N'ccef0ac1-8e86-494d-b5de-fbe3fd40b323', 0, 0, 0, CAST(N'2025-07-08T02:29:26.000' AS DateTime), NULL, N'1dab16ed-219a-4bb4-b37b-2ae04e2996ba', 0.5, NULL)

-- Answers for Child Question 2.3
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'9cc82850-0a90-483d-941d-c084518c90c1', N'Parameterized queries, input validation, stored procedures', 0, 1, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'9cc82850-0a90-483d-941d-c084518c90c1', N'Only encryption', 1, 0, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'9cc82850-0a90-483d-941d-c084518c90c1', N'Only backups', 2, 0, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'9cc82850-0a90-483d-941d-c084518c90c1', N'Only indexing', 3, 0, 1)

-- Child Question 2.4
INSERT [dbo].[CauHoi] ([MaCauHoi], [MaPhan], [MaSoCauHoi], [NoiDung], [HoanVi], [CapDo], [SoCauHoiCon], [DoPhanCachCauHoi], [MaCauHoiCha], [XoaTamCauHoi], [SoLanDuocThi], [SoLanDung], [NgayTao], [NgaySua], [MaCLO], [DoKhoThucTe], [NguoiTao]) VALUES
(N'f2a1dfa5-de64-4bbc-9a47-777720118659', N'bb52f95f-db06-48fc-b111-2b2bbd6e38e2', 70015, N'(<4>) What can help identify SQL injection vulnerabilities?[<br>]', 1, 2, 0, 0.5, N'ccef0ac1-8e86-494d-b5de-fbe3fd40b323', 0, 0, 0, CAST(N'2025-07-08T02:29:26.000' AS DateTime), NULL, N'1dab16ed-219a-4bb4-b37b-2ae04e2996ba', 0.5, NULL)

-- Answers for Child Question 2.4
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'f2a1dfa5-de64-4bbc-9a47-777720118659', N'Regular security audits', 0, 1, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'f2a1dfa5-de64-4bbc-9a47-777720118659', N'Performance monitoring', 1, 0, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'f2a1dfa5-de64-4bbc-9a47-777720118659', N'Data compression', 2, 0, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'f2a1dfa5-de64-4bbc-9a47-777720118659', N'Query optimization', 3, 0, 1)

-- Child Question 2.5
INSERT [dbo].[CauHoi] ([MaCauHoi], [MaPhan], [MaSoCauHoi], [NoiDung], [HoanVi], [CapDo], [SoCauHoiCon], [DoPhanCachCauHoi], [MaCauHoiCha], [XoaTamCauHoi], [SoLanDuocThi], [SoLanDung], [NgayTao], [NgaySua], [MaCLO], [DoKhoThucTe], [NguoiTao]) VALUES
(N'17a1daf6-0c71-4d8c-aeec-e2f99e47696f', N'bb52f95f-db06-48fc-b111-2b2bbd6e38e2', 70016, N'(<5>) Why is SQL injection considered dangerous?[<br>]', 1, 2, 0, 0.5, N'ccef0ac1-8e86-494d-b5de-fbe3fd40b323', 0, 0, 0, CAST(N'2025-07-08T02:29:26.000' AS DateTime), NULL, N'1dab16ed-219a-4bb4-b37b-2ae04e2996ba', 0.5, NULL)

-- Answers for Child Question 2.5
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'17a1daf6-0c71-4d8c-aeec-e2f99e47696f', N'It allows attackers to manipulate database operations', 0, 1, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'17a1daf6-0c71-4d8c-aeec-e2f99e47696f', N'It slows down queries', 1, 0, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'17a1daf6-0c71-4d8c-aeec-e2f99e47696f', N'It uses more storage', 2, 0, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'17a1daf6-0c71-4d8c-aeec-e2f99e47696f', N'It requires more memory', 3, 0, 1)

-- Group Question 3: Database Security
INSERT [dbo].[CauHoi] ([MaCauHoi], [MaPhan], [MaSoCauHoi], [NoiDung], [HoanVi], [CapDo], [SoCauHoiCon], [DoPhanCachCauHoi], [MaCauHoiCha], [XoaTamCauHoi], [SoLanDuocThi], [SoLanDung], [NgayTao], [NgaySua], [MaCLO], [DoKhoThucTe], [NguoiTao]) VALUES
(N'1180f0fd-b10d-4583-a5e9-57838c6a5031', N'bb52f95f-db06-48fc-b111-2b2bbd6e38e2', 70021, N'[<sg>]Database encryption protects sensitive information by converting readable data into coded format. There are two main types: encryption at rest (protecting stored data) and encryption in transit (protecting data during transmission). Modern databases support various encryption algorithms including AES, RSA, and TLS. Proper key management is crucial for maintaining encryption security. [<egc>](<1>) What does database encryption protect? (<2>) What are the two main types of database encryption? (<3>) What does encryption at rest protect? (<4>) What does encryption in transit protect? (<5>) What is crucial for maintaining encryption security? [</sg>]', 0, 2, 5, 0.5, NULL, 0, 0, 0, CAST(N'2025-07-08T02:29:26.000' AS DateTime), NULL, N'1dab16ed-219a-4bb4-b37b-2ae04e2996ba', 0.5, NULL)

-- Child Question 3.1
INSERT [dbo].[CauHoi] ([MaCauHoi], [MaPhan], [MaSoCauHoi], [NoiDung], [HoanVi], [CapDo], [SoCauHoiCon], [DoPhanCachCauHoi], [MaCauHoiCha], [XoaTamCauHoi], [SoLanDuocThi], [SoLanDung], [NgayTao], [NgaySua], [MaCLO], [DoKhoThucTe], [NguoiTao]) VALUES
(N'583f7dcf-fc5c-4bf0-8abd-979eafb22bae', N'bb52f95f-db06-48fc-b111-2b2bbd6e38e2', 70022, N'(<1>) What does database encryption protect?[<br>]', 1, 2, 0, 0.5, N'1180f0fd-b10d-4583-a5e9-57838c6a5031', 0, 0, 0, CAST(N'2025-07-08T02:29:26.000' AS DateTime), NULL, N'1dab16ed-219a-4bb4-b37b-2ae04e2996ba', 0.5, NULL)

-- Answers for Child Question 3.1
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'583f7dcf-fc5c-4bf0-8abd-979eafb22bae', N'Sensitive information by converting it to coded format', 0, 1, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'583f7dcf-fc5c-4bf0-8abd-979eafb22bae', N'Database performance', 1, 0, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'583f7dcf-fc5c-4bf0-8abd-979eafb22bae', N'Query speed', 2, 0, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'583f7dcf-fc5c-4bf0-8abd-979eafb22bae', N'Storage space', 3, 0, 1)

-- Child Question 3.2
INSERT [dbo].[CauHoi] ([MaCauHoi], [MaPhan], [MaSoCauHoi], [NoiDung], [HoanVi], [CapDo], [SoCauHoiCon], [DoPhanCachCauHoi], [MaCauHoiCha], [XoaTamCauHoi], [SoLanDuocThi], [SoLanDung], [NgayTao], [NgaySua], [MaCLO], [DoKhoThucTe], [NguoiTao]) VALUES
(N'09b7ca5c-a0db-412a-8430-bb92de6c42e4', N'bb52f95f-db06-48fc-b111-2b2bbd6e38e2', 70023, N'(<2>) What are the two main types of database encryption?[<br>]', 1, 2, 0, 0.5, N'1180f0fd-b10d-4583-a5e9-57838c6a5031', 0, 0, 0, CAST(N'2025-07-08T02:29:26.000' AS DateTime), NULL, N'1dab16ed-219a-4bb4-b37b-2ae04e2996ba', 0.5, NULL)

-- Answers for Child Question 3.2
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'09b7ca5c-a0db-412a-8430-bb92de6c42e4', N'Encryption at rest and encryption in transit', 0, 1, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'09b7ca5c-a0db-412a-8430-bb92de6c42e4', N'Only file encryption', 1, 0, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'09b7ca5c-a0db-412a-8430-bb92de6c42e4', N'Only network encryption', 2, 0, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'09b7ca5c-a0db-412a-8430-bb92de6c42e4', N'Only password encryption', 3, 0, 1)

-- Child Question 3.3
INSERT [dbo].[CauHoi] ([MaCauHoi], [MaPhan], [MaSoCauHoi], [NoiDung], [HoanVi], [CapDo], [SoCauHoiCon], [DoPhanCachCauHoi], [MaCauHoiCha], [XoaTamCauHoi], [SoLanDuocThi], [SoLanDung], [NgayTao], [NgaySua], [MaCLO], [DoKhoThucTe], [NguoiTao]) VALUES
(N'a22da959-a5d1-481b-b2b8-137f2cc77b66', N'bb52f95f-db06-48fc-b111-2b2bbd6e38e2', 70024, N'(<3>) What does encryption at rest protect?[<br>]', 1, 2, 0, 0.5, N'1180f0fd-b10d-4583-a5e9-57838c6a5031', 0, 0, 0, CAST(N'2025-07-08T02:29:26.000' AS DateTime), NULL, N'1dab16ed-219a-4bb4-b37b-2ae04e2996ba', 0.5, NULL)

-- Answers for Child Question 3.3
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'a22da959-a5d1-481b-b2b8-137f2cc77b66', N'Stored data', 0, 1, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'a22da959-a5d1-481b-b2b8-137f2cc77b66', N'Network traffic', 1, 0, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'a22da959-a5d1-481b-b2b8-137f2cc77b66', N'User sessions', 2, 0, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'a22da959-a5d1-481b-b2b8-137f2cc77b66', N'Application code', 3, 0, 1)

-- Child Question 3.4
INSERT [dbo].[CauHoi] ([MaCauHoi], [MaPhan], [MaSoCauHoi], [NoiDung], [HoanVi], [CapDo], [SoCauHoiCon], [DoPhanCachCauHoi], [MaCauHoiCha], [XoaTamCauHoi], [SoLanDuocThi], [SoLanDung], [NgayTao], [NgaySua], [MaCLO], [DoKhoThucTe], [NguoiTao]) VALUES
(N'5c78b6aa-86d4-4bab-95bc-91100584b22c', N'bb52f95f-db06-48fc-b111-2b2bbd6e38e2', 70025, N'(<4>) What does encryption in transit protect?[<br>]', 1, 2, 0, 0.5, N'1180f0fd-b10d-4583-a5e9-57838c6a5031', 0, 0, 0, CAST(N'2025-07-08T02:29:26.000' AS DateTime), NULL, N'1dab16ed-219a-4bb4-b37b-2ae04e2996ba', 0.5, NULL)

-- Answers for Child Question 3.4
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'5c78b6aa-86d4-4bab-95bc-91100584b22c', N'Data during transmission', 0, 1, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'5c78b6aa-86d4-4bab-95bc-91100584b22c', N'Data in storage', 1, 0, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'5c78b6aa-86d4-4bab-95bc-91100584b22c', N'Data in memory', 2, 0, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'5c78b6aa-86d4-4bab-95bc-91100584b22c', N'Data in cache', 3, 0, 1)

-- Child Question 3.5
INSERT [dbo].[CauHoi] ([MaCauHoi], [MaPhan], [MaSoCauHoi], [NoiDung], [HoanVi], [CapDo], [SoCauHoiCon], [DoPhanCachCauHoi], [MaCauHoiCha], [XoaTamCauHoi], [SoLanDuocThi], [SoLanDung], [NgayTao], [NgaySua], [MaCLO], [DoKhoThucTe], [NguoiTao]) VALUES
(N'fc16c5ae-c612-48a2-82d5-6466a07e0440', N'bb52f95f-db06-48fc-b111-2b2bbd6e38e2', 70026, N'(<5>) What is crucial for maintaining encryption security?[<br>]', 1, 2, 0, 0.5, N'1180f0fd-b10d-4583-a5e9-57838c6a5031', 0, 0, 0, CAST(N'2025-07-08T02:29:26.000' AS DateTime), NULL, N'1dab16ed-219a-4bb4-b37b-2ae04e2996ba', 0.5, NULL)

-- Answers for Child Question 3.5
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'fc16c5ae-c612-48a2-82d5-6466a07e0440', N'Proper key management', 0, 1, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'fc16c5ae-c612-48a2-82d5-6466a07e0440', N'Fast processors', 1, 0, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'fc16c5ae-c612-48a2-82d5-6466a07e0440', N'Large storage', 2, 0, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'fc16c5ae-c612-48a2-82d5-6466a07e0440', N'High bandwidth', 3, 0, 1)

-- Group Question 4: Database Security
INSERT [dbo].[CauHoi] ([MaCauHoi], [MaPhan], [MaSoCauHoi], [NoiDung], [HoanVi], [CapDo], [SoCauHoiCon], [DoPhanCachCauHoi], [MaCauHoiCha], [XoaTamCauHoi], [SoLanDuocThi], [SoLanDung], [NgayTao], [NgaySua], [MaCLO], [DoKhoThucTe], [NguoiTao]) VALUES
(N'dd3fce32-f2b9-4905-bf34-416452b9f454', N'bb52f95f-db06-48fc-b111-2b2bbd6e38e2', 70031, N'[<sg>]Database access control manages {<1>}_____ can view, modify, or delete information in a database. Role-based access control (RBAC) assigns {<2>}_____ to users based on their job functions. The principle of {<3>}_____ privilege ensures users have only the minimum access needed. Access control lists (ACLs) define {<4>}_____ permissions for database objects. Regular {<5>}_____ of access rights helps maintain security. [<egc>](<1>) Fill in blank 1: (<2>) Fill in blank 2: (<3>) Fill in blank 3: (<4>) Fill in blank 4: (<5>) Fill in blank 5: [</sg>]', 0, 2, 5, 0.5, NULL, 0, 0, 0, CAST(N'2025-07-08T02:29:26.000' AS DateTime), NULL, N'1dab16ed-219a-4bb4-b37b-2ae04e2996ba', 0.5, NULL)

-- Child Question 4.1
INSERT [dbo].[CauHoi] ([MaCauHoi], [MaPhan], [MaSoCauHoi], [NoiDung], [HoanVi], [CapDo], [SoCauHoiCon], [DoPhanCachCauHoi], [MaCauHoiCha], [XoaTamCauHoi], [SoLanDuocThi], [SoLanDung], [NgayTao], [NgaySua], [MaCLO], [DoKhoThucTe], [NguoiTao]) VALUES
(N'11805849-2878-4f34-967f-710550a528f1', N'bb52f95f-db06-48fc-b111-2b2bbd6e38e2', 70032, N'(<1>) Fill in blank 1:[<br>]', 1, 2, 0, 0.5, N'dd3fce32-f2b9-4905-bf34-416452b9f454', 0, 0, 0, CAST(N'2025-07-08T02:29:26.000' AS DateTime), NULL, N'1dab16ed-219a-4bb4-b37b-2ae04e2996ba', 0.5, NULL)

-- Answers for Child Question 4.1
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'11805849-2878-4f34-967f-710550a528f1', N'who', 0, 1, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'11805849-2878-4f34-967f-710550a528f1', N'what', 1, 0, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'11805849-2878-4f34-967f-710550a528f1', N'when', 2, 0, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'11805849-2878-4f34-967f-710550a528f1', N'where', 3, 0, 1)

-- Child Question 4.2
INSERT [dbo].[CauHoi] ([MaCauHoi], [MaPhan], [MaSoCauHoi], [NoiDung], [HoanVi], [CapDo], [SoCauHoiCon], [DoPhanCachCauHoi], [MaCauHoiCha], [XoaTamCauHoi], [SoLanDuocThi], [SoLanDung], [NgayTao], [NgaySua], [MaCLO], [DoKhoThucTe], [NguoiTao]) VALUES
(N'f480128a-7d92-4020-834a-c2af11e3a7bf', N'bb52f95f-db06-48fc-b111-2b2bbd6e38e2', 70033, N'(<2>) Fill in blank 2:[<br>]', 1, 2, 0, 0.5, N'dd3fce32-f2b9-4905-bf34-416452b9f454', 0, 0, 0, CAST(N'2025-07-08T02:29:26.000' AS DateTime), NULL, N'1dab16ed-219a-4bb4-b37b-2ae04e2996ba', 0.5, NULL)

-- Answers for Child Question 4.2
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'f480128a-7d92-4020-834a-c2af11e3a7bf', N'permissions', 0, 1, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'f480128a-7d92-4020-834a-c2af11e3a7bf', N'passwords', 1, 0, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'f480128a-7d92-4020-834a-c2af11e3a7bf', N'databases', 2, 0, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'f480128a-7d92-4020-834a-c2af11e3a7bf', N'servers', 3, 0, 1)

-- Child Question 4.3
INSERT [dbo].[CauHoi] ([MaCauHoi], [MaPhan], [MaSoCauHoi], [NoiDung], [HoanVi], [CapDo], [SoCauHoiCon], [DoPhanCachCauHoi], [MaCauHoiCha], [XoaTamCauHoi], [SoLanDuocThi], [SoLanDung], [NgayTao], [NgaySua], [MaCLO], [DoKhoThucTe], [NguoiTao]) VALUES
(N'8ed62c60-a287-4597-86f0-60a078553a52', N'bb52f95f-db06-48fc-b111-2b2bbd6e38e2', 70034, N'(<3>) Fill in blank 3:[<br>]', 1, 2, 0, 0.5, N'dd3fce32-f2b9-4905-bf34-416452b9f454', 0, 0, 0, CAST(N'2025-07-08T02:29:26.000' AS DateTime), NULL, N'1dab16ed-219a-4bb4-b37b-2ae04e2996ba', 0.5, NULL)

-- Answers for Child Question 4.3
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'8ed62c60-a287-4597-86f0-60a078553a52', N'least', 0, 1, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'8ed62c60-a287-4597-86f0-60a078553a52', N'most', 1, 0, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'8ed62c60-a287-4597-86f0-60a078553a52', N'maximum', 2, 0, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'8ed62c60-a287-4597-86f0-60a078553a52', N'unlimited', 3, 0, 1)

-- Child Question 4.4
INSERT [dbo].[CauHoi] ([MaCauHoi], [MaPhan], [MaSoCauHoi], [NoiDung], [HoanVi], [CapDo], [SoCauHoiCon], [DoPhanCachCauHoi], [MaCauHoiCha], [XoaTamCauHoi], [SoLanDuocThi], [SoLanDung], [NgayTao], [NgaySua], [MaCLO], [DoKhoThucTe], [NguoiTao]) VALUES
(N'0740ea40-754e-4f39-8db5-e999d7c9bc5e', N'bb52f95f-db06-48fc-b111-2b2bbd6e38e2', 70035, N'(<4>) Fill in blank 4:[<br>]', 1, 2, 0, 0.5, N'dd3fce32-f2b9-4905-bf34-416452b9f454', 0, 0, 0, CAST(N'2025-07-08T02:29:26.000' AS DateTime), NULL, N'1dab16ed-219a-4bb4-b37b-2ae04e2996ba', 0.5, NULL)

-- Answers for Child Question 4.4
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'0740ea40-754e-4f39-8db5-e999d7c9bc5e', N'specific', 0, 1, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'0740ea40-754e-4f39-8db5-e999d7c9bc5e', N'general', 1, 0, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'0740ea40-754e-4f39-8db5-e999d7c9bc5e', N'random', 2, 0, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'0740ea40-754e-4f39-8db5-e999d7c9bc5e', N'temporary', 3, 0, 1)

-- Child Question 4.5
INSERT [dbo].[CauHoi] ([MaCauHoi], [MaPhan], [MaSoCauHoi], [NoiDung], [HoanVi], [CapDo], [SoCauHoiCon], [DoPhanCachCauHoi], [MaCauHoiCha], [XoaTamCauHoi], [SoLanDuocThi], [SoLanDung], [NgayTao], [NgaySua], [MaCLO], [DoKhoThucTe], [NguoiTao]) VALUES
(N'4e3b1a20-37d5-4c59-af72-029855ca327b', N'bb52f95f-db06-48fc-b111-2b2bbd6e38e2', 70036, N'(<5>) Fill in blank 5:[<br>]', 1, 2, 0, 0.5, N'dd3fce32-f2b9-4905-bf34-416452b9f454', 0, 0, 0, CAST(N'2025-07-08T02:29:26.000' AS DateTime), NULL, N'1dab16ed-219a-4bb4-b37b-2ae04e2996ba', 0.5, NULL)

-- Answers for Child Question 4.5
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'4e3b1a20-37d5-4c59-af72-029855ca327b', N'reviews', 0, 1, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'4e3b1a20-37d5-4c59-af72-029855ca327b', N'installations', 1, 0, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'4e3b1a20-37d5-4c59-af72-029855ca327b', N'deletions', 2, 0, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'4e3b1a20-37d5-4c59-af72-029855ca327b', N'compressions', 3, 0, 1)

-- Group Question 5: Database Security
INSERT [dbo].[CauHoi] ([MaCauHoi], [MaPhan], [MaSoCauHoi], [NoiDung], [HoanVi], [CapDo], [SoCauHoiCon], [DoPhanCachCauHoi], [MaCauHoiCha], [XoaTamCauHoi], [SoLanDuocThi], [SoLanDung], [NgayTao], [NgaySua], [MaCLO], [DoKhoThucTe], [NguoiTao]) VALUES
(N'736c51e5-f070-45ae-9394-46e8b43f0722', N'bb52f95f-db06-48fc-b111-2b2bbd6e38e2', 70041, N'[<sg>]Database firewalls monitor and {<1>}_____ network traffic to and from database servers. They can block {<2>}_____ connections and suspicious activities. Application-level firewalls inspect {<3>}_____ queries for malicious content. Network-level firewalls control access based on {<4>}_____ addresses and ports. Proper firewall {<5>}_____ is essential for database security. [<egc>](<1>) Fill in blank 1: (<2>) Fill in blank 2: (<3>) Fill in blank 3: (<4>) Fill in blank 4: (<5>) Fill in blank 5: [</sg>]', 0, 2, 5, 0.5, NULL, 0, 0, 0, CAST(N'2025-07-08T02:29:26.000' AS DateTime), NULL, N'1dab16ed-219a-4bb4-b37b-2ae04e2996ba', 0.5, NULL)

-- Child Question 5.1
INSERT [dbo].[CauHoi] ([MaCauHoi], [MaPhan], [MaSoCauHoi], [NoiDung], [HoanVi], [CapDo], [SoCauHoiCon], [DoPhanCachCauHoi], [MaCauHoiCha], [XoaTamCauHoi], [SoLanDuocThi], [SoLanDung], [NgayTao], [NgaySua], [MaCLO], [DoKhoThucTe], [NguoiTao]) VALUES
(N'd69c4d4b-c22f-4bff-8644-7f8e818aec4a', N'bb52f95f-db06-48fc-b111-2b2bbd6e38e2', 70042, N'(<1>) Fill in blank 1:[<br>]', 1, 2, 0, 0.5, N'736c51e5-f070-45ae-9394-46e8b43f0722', 0, 0, 0, CAST(N'2025-07-08T02:29:26.000' AS DateTime), NULL, N'1dab16ed-219a-4bb4-b37b-2ae04e2996ba', 0.5, NULL)

-- Answers for Child Question 5.1
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'd69c4d4b-c22f-4bff-8644-7f8e818aec4a', N'control', 0, 1, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'd69c4d4b-c22f-4bff-8644-7f8e818aec4a', N'ignore', 1, 0, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'd69c4d4b-c22f-4bff-8644-7f8e818aec4a', N'delete', 2, 0, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'd69c4d4b-c22f-4bff-8644-7f8e818aec4a', N'compress', 3, 0, 1)

-- Child Question 5.2
INSERT [dbo].[CauHoi] ([MaCauHoi], [MaPhan], [MaSoCauHoi], [NoiDung], [HoanVi], [CapDo], [SoCauHoiCon], [DoPhanCachCauHoi], [MaCauHoiCha], [XoaTamCauHoi], [SoLanDuocThi], [SoLanDung], [NgayTao], [NgaySua], [MaCLO], [DoKhoThucTe], [NguoiTao]) VALUES
(N'9c1fc39a-8372-4740-bbe0-36aec5d379fc', N'bb52f95f-db06-48fc-b111-2b2bbd6e38e2', 70043, N'(<2>) Fill in blank 2:[<br>]', 1, 2, 0, 0.5, N'736c51e5-f070-45ae-9394-46e8b43f0722', 0, 0, 0, CAST(N'2025-07-08T02:29:26.000' AS DateTime), NULL, N'1dab16ed-219a-4bb4-b37b-2ae04e2996ba', 0.5, NULL)

-- Answers for Child Question 5.2
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'9c1fc39a-8372-4740-bbe0-36aec5d379fc', N'unauthorized', 0, 1, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'9c1fc39a-8372-4740-bbe0-36aec5d379fc', N'authorized', 1, 0, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'9c1fc39a-8372-4740-bbe0-36aec5d379fc', N'fast', 2, 0, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'9c1fc39a-8372-4740-bbe0-36aec5d379fc', N'slow', 3, 0, 1)

-- Child Question 5.3
INSERT [dbo].[CauHoi] ([MaCauHoi], [MaPhan], [MaSoCauHoi], [NoiDung], [HoanVi], [CapDo], [SoCauHoiCon], [DoPhanCachCauHoi], [MaCauHoiCha], [XoaTamCauHoi], [SoLanDuocThi], [SoLanDung], [NgayTao], [NgaySua], [MaCLO], [DoKhoThucTe], [NguoiTao]) VALUES
(N'd62e0a33-04b6-4787-be31-450e0d435d0e', N'bb52f95f-db06-48fc-b111-2b2bbd6e38e2', 70044, N'(<3>) Fill in blank 3:[<br>]', 1, 2, 0, 0.5, N'736c51e5-f070-45ae-9394-46e8b43f0722', 0, 0, 0, CAST(N'2025-07-08T02:29:26.000' AS DateTime), NULL, N'1dab16ed-219a-4bb4-b37b-2ae04e2996ba', 0.5, NULL)

-- Answers for Child Question 5.3
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'd62e0a33-04b6-4787-be31-450e0d435d0e', N'SQL', 0, 1, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'd62e0a33-04b6-4787-be31-450e0d435d0e', N'HTML', 1, 0, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'd62e0a33-04b6-4787-be31-450e0d435d0e', N'CSS', 2, 0, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'd62e0a33-04b6-4787-be31-450e0d435d0e', N'JavaScript', 3, 0, 1)

-- Child Question 5.4
INSERT [dbo].[CauHoi] ([MaCauHoi], [MaPhan], [MaSoCauHoi], [NoiDung], [HoanVi], [CapDo], [SoCauHoiCon], [DoPhanCachCauHoi], [MaCauHoiCha], [XoaTamCauHoi], [SoLanDuocThi], [SoLanDung], [NgayTao], [NgaySua], [MaCLO], [DoKhoThucTe], [NguoiTao]) VALUES
(N'a60d57a5-809c-4803-a653-fd4a35cfb575', N'bb52f95f-db06-48fc-b111-2b2bbd6e38e2', 70045, N'(<4>) Fill in blank 4:[<br>]', 1, 2, 0, 0.5, N'736c51e5-f070-45ae-9394-46e8b43f0722', 0, 0, 0, CAST(N'2025-07-08T02:29:26.000' AS DateTime), NULL, N'1dab16ed-219a-4bb4-b37b-2ae04e2996ba', 0.5, NULL)

-- Answers for Child Question 5.4
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'a60d57a5-809c-4803-a653-fd4a35cfb575', N'IP', 0, 1, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'a60d57a5-809c-4803-a653-fd4a35cfb575', N'MAC', 1, 0, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'a60d57a5-809c-4803-a653-fd4a35cfb575', N'DNS', 2, 0, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'a60d57a5-809c-4803-a653-fd4a35cfb575', N'URL', 3, 0, 1)

-- Child Question 5.5
INSERT [dbo].[CauHoi] ([MaCauHoi], [MaPhan], [MaSoCauHoi], [NoiDung], [HoanVi], [CapDo], [SoCauHoiCon], [DoPhanCachCauHoi], [MaCauHoiCha], [XoaTamCauHoi], [SoLanDuocThi], [SoLanDung], [NgayTao], [NgaySua], [MaCLO], [DoKhoThucTe], [NguoiTao]) VALUES
(N'437fb43f-7d21-437a-82e1-7b2fd0a13069', N'bb52f95f-db06-48fc-b111-2b2bbd6e38e2', 70046, N'(<5>) Fill in blank 5:[<br>]', 1, 2, 0, 0.5, N'736c51e5-f070-45ae-9394-46e8b43f0722', 0, 0, 0, CAST(N'2025-07-08T02:29:26.000' AS DateTime), NULL, N'1dab16ed-219a-4bb4-b37b-2ae04e2996ba', 0.5, NULL)

-- Answers for Child Question 5.5
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'437fb43f-7d21-437a-82e1-7b2fd0a13069', N'configuration', 0, 1, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'437fb43f-7d21-437a-82e1-7b2fd0a13069', N'installation', 1, 0, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'437fb43f-7d21-437a-82e1-7b2fd0a13069', N'removal', 2, 0, 1)
INSERT [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi]) VALUES (NEWID(), N'437fb43f-7d21-437a-82e1-7b2fd0a13069', N'compression', 3, 0, 1)

-- NOTE: This script shows 5 example group questions.
-- Extend this pattern to create all 30 group questions about Database Security.
-- Topics to cover: Authentication, Authorization, SQL Injection, Encryption,
-- Access Control, Audit Trails, Backup Security, User Management,
-- Role-based Security, Database Firewall, Data Masking, etc.

GO