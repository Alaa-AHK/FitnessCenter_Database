-- ============================================================
-- SQL FUNCTIONS (Phase 2)
-- ============================================================

-- ============================================================
-- FUNCTION 1: Get Member Age
-- Calculates a member's current age from their BirthDate
-- ============================================================
CREATE OR ALTER FUNCTION fn_GetMemberAge (@MemberID INT)
RETURNS INT
AS
BEGIN
    DECLARE @Age INT;

    SELECT @Age = DATEDIFF(YEAR, BirthDate, GETDATE()) -
        CASE
            WHEN MONTH(BirthDate) > MONTH(GETDATE()) THEN 1
            WHEN MONTH(BirthDate) = MONTH(GETDATE()) AND DAY(BirthDate) > DAY(GETDATE()) THEN 1
            ELSE 0
        END
    FROM Members
    WHERE MemberID = @MemberID;

    RETURN @Age;
END;
GO


-- ============================================================
-- FUNCTION 2: Get Membership Plan End Date
-- Returns the date a member's plan expires based on plan duration
-- ============================================================
CREATE OR ALTER FUNCTION fn_GetPlanEndDate (@MemberID INT)
RETURNS DATE
AS
BEGIN
    DECLARE @EndDate DATE;

    SELECT @EndDate = DATEADD(MONTH, mp.Duration, m.PlanStartDate)
    FROM Members m
    JOIN MembershipPlan mp ON m.PlanID = mp.MembershipID
    WHERE m.MemberID = @MemberID;

    RETURN @EndDate;
END;
GO


-- ============================================================
-- FUNCTION 3: Check If Member Plan Is Active
-- Returns 1 if the member's plan is still active, 0 if expired
-- ============================================================
CREATE OR ALTER FUNCTION fn_IsMemberPlanActive (@MemberID INT)
RETURNS BIT
AS
BEGIN
    DECLARE @IsActive BIT = 0;

    IF dbo.fn_GetPlanEndDate(@MemberID) >= CAST(GETDATE() AS DATE)
        SET @IsActive = 1;

    RETURN @IsActive;
END;
GO


-- ============================================================
-- FUNCTION 4: Get Total Number of Classes a Member Attends
-- Returns the count of classes attended by a specific member
-- ============================================================
CREATE OR ALTER FUNCTION fn_GetMemberClassCount (@MemberID INT)
RETURNS INT
AS
BEGIN
    DECLARE @Count INT;

    SELECT @Count = COUNT(*)
    FROM Attend
    WHERE MemberID = @MemberID;

    RETURN ISNULL(@Count, 0);
END;
GO


-- ============================================================
-- FUNCTION 5: Get Coach Total Members Count
-- Returns the number of members privately trained by a coach
-- ============================================================
CREATE OR ALTER FUNCTION fn_GetCoachMemberCount (@CoachID INT)
RETURNS INT
AS
BEGIN
    DECLARE @Count INT;

    SELECT @Count = COUNT(*)
    FROM Members
    WHERE CoachID = @CoachID;

    RETURN ISNULL(@Count, 0);
END;
GO


-- ============================================================
-- FUNCTION 6: Get Number of Classes Led by a Coach
-- Returns the total number of classes a coach leads
-- ============================================================
CREATE OR ALTER FUNCTION fn_GetCoachClassCount (@CoachID INT)
RETURNS INT
AS
BEGIN
    DECLARE @Count INT;

    SELECT @Count = COUNT(*)
    FROM Class
    WHERE LeadingCoachID = @CoachID;

    RETURN ISNULL(@Count, 0);
END;
GO


-- ============================================================
-- FUNCTION 7: Get Branch Equipment Count
-- Returns total number of equipment pieces in a branch
-- ============================================================
CREATE OR ALTER FUNCTION fn_GetBranchEquipmentCount (@BranchID INT)
RETURNS INT
AS
BEGIN
    DECLARE @Count INT;

    SELECT @Count = COUNT(*)
    FROM Contain
    WHERE BranchID = @BranchID;

    RETURN ISNULL(@Count, 0);
END;
GO


-- ============================================================
-- FUNCTION 8: Get Branch Class Count
-- Returns total number of classes hosted by a branch
-- ============================================================
CREATE OR ALTER FUNCTION fn_GetBranchClassCount (@BranchID INT)
RETURNS INT
AS
BEGIN
    DECLARE @Count INT;

    SELECT @Count = COUNT(*)
    FROM Host
    WHERE BranchID = @BranchID;

    RETURN ISNULL(@Count, 0);
END;
GO


-- ============================================================
-- FUNCTION 9: Get Class Attendance Count
-- Returns how many members attend a specific class
-- ============================================================
CREATE OR ALTER FUNCTION fn_GetClassAttendanceCount (@ClassID INT)
RETURNS INT
AS
BEGIN
    DECLARE @Count INT;

    SELECT @Count = COUNT(*)
    FROM Attend
    WHERE ClassID = @ClassID;

    RETURN ISNULL(@Count, 0);
END;
GO


-- ============================================================
-- FUNCTION 10: Check If Class Is Full
-- Returns 1 if class has reached its capacity, 0 otherwise
-- ============================================================
CREATE OR ALTER FUNCTION fn_IsClassFull (@ClassID INT)
RETURNS BIT
AS
BEGIN
    DECLARE @IsFull BIT = 0;
    DECLARE @Capacity INT;
    DECLARE @Attending INT;

    SELECT @Capacity = Capacity FROM Class WHERE ClassID = @ClassID;
    SET @Attending = dbo.fn_GetClassAttendanceCount(@ClassID);

    IF @Attending >= @Capacity
        SET @IsFull = 1;

    RETURN @IsFull;
END;
GO


-- ============================================================
-- FUNCTION 11: Get Available Spots in a Class
-- Returns the number of remaining spots in a class
-- ============================================================
CREATE OR ALTER FUNCTION fn_GetClassAvailableSpots (@ClassID INT)
RETURNS INT
AS
BEGIN
    DECLARE @Available INT;
    DECLARE @Capacity INT;

    SELECT @Capacity = Capacity FROM Class WHERE ClassID = @ClassID;
    SET @Available = @Capacity - dbo.fn_GetClassAttendanceCount(@ClassID);

    RETURN CASE WHEN @Available < 0 THEN 0 ELSE @Available END;
END;
GO


-- ============================================================
-- FUNCTION 12: Get Last Maintenance Date for Equipment
-- Returns the most recent maintenance date for a piece of equipment
-- ============================================================
CREATE OR ALTER FUNCTION fn_GetLastMaintenanceDate (@EquipmentID INT)
RETURNS DATE
AS
BEGIN
    DECLARE @LastDate DATE;

    SELECT @LastDate = MAX(LogDate)
    FROM MaintenanceLog
    WHERE EquipmentID = @EquipmentID;

    RETURN @LastDate;
END;
GO


-- ============================================================
-- FUNCTION 13: Get Coach Certificate Count
-- Returns the number of certificates a coach holds
-- ============================================================
CREATE OR ALTER FUNCTION fn_GetCoachCertificateCount (@CoachID INT)
RETURNS INT
AS
BEGIN
    DECLARE @Count INT;

    SELECT @Count = COUNT(*)
    FROM CoachCertificate
    WHERE CoachID = @CoachID;

    RETURN ISNULL(@Count, 0);
END;
GO


-- ============================================================
-- FUNCTION 14: Get Membership Plan Annual Cost
-- Normalizes any plan price to an equivalent annual cost for comparison
-- ============================================================
CREATE OR ALTER FUNCTION fn_GetAnnualCost (@PlanID INT)
RETURNS DECIMAL(10, 2)
AS
BEGIN
    DECLARE @AnnualCost DECIMAL(10, 2);

    SELECT @AnnualCost = CAST(Price AS DECIMAL(10,2)) / Duration * 12
    FROM MembershipPlan
    WHERE MembershipID = @PlanID;

    RETURN @AnnualCost;
END;
GO


-- ============================================================
-- FUNCTION 15 (Table-Valued): Get All Members of a Coach
-- Returns a table of all members assigned to a given coach
-- ============================================================
CREATE OR ALTER FUNCTION fn_GetCoachMembers (@CoachID INT)
RETURNS TABLE
AS
RETURN
(
    SELECT
        m.MemberID,
        m.MemberName,
        m.MemberGender,
        m.WorkoutPlan,
        m.PhoneNumber,
        dbo.fn_GetMemberAge(m.MemberID)       AS Age,
        dbo.fn_IsMemberPlanActive(m.MemberID) AS PlanActive
    FROM Members m
    WHERE m.CoachID = @CoachID
);
GO


-- ============================================================
-- FUNCTION 16 (Table-Valued): Get All Equipment in a Branch
-- Returns a table of all equipment located in a given branch
-- ============================================================
CREATE OR ALTER FUNCTION fn_GetBranchEquipment (@BranchID INT)
RETURNS TABLE
AS
RETURN
(
    SELECT
        e.EquipmentID,
        e.EquipmentType,
        dbo.fn_GetLastMaintenanceDate(e.EquipmentID) AS LastMaintained
    FROM Equipment e
    JOIN Contain c ON e.EquipmentID = c.EquipmentID
    WHERE c.BranchID = @BranchID
);
GO


-- ============================================================
-- FUNCTION 17 (Table-Valued): Get All Classes Attended by a Member
-- Returns a table of class details for every class a member attends
-- ============================================================
CREATE OR ALTER FUNCTION fn_GetMemberClasses (@MemberID INT)
RETURNS TABLE
AS
RETURN
(
    SELECT
        cl.ClassID,
        cl.ClassName,
        cl.Capacity,
        c.CoachName                                AS LeadingCoach,
        dbo.fn_GetClassAttendanceCount(cl.ClassID) AS TotalAttendees,
        dbo.fn_GetClassAvailableSpots(cl.ClassID)  AS AvailableSpots
    FROM Attend a
    JOIN Class cl ON a.ClassID = cl.ClassID
    JOIN Coach c  ON cl.LeadingCoachID = c.CoachID
    WHERE a.MemberID = @MemberID
);
GO


-- ============================================================
-- FUNCTION 18 (Table-Valued): Get Full Member Profile
-- Returns a full summary of a single member including plan & coach
-- ============================================================
CREATE OR ALTER FUNCTION fn_GetMemberProfile (@MemberID INT)
RETURNS TABLE
AS
RETURN
(
    SELECT
        m.MemberID,
        m.MemberName,
        m.MemberGender,
        dbo.fn_GetMemberAge(m.MemberID)       AS Age,
        m.PhoneNumber,
        m.WorkoutPlan,
        m.CoachID,                             -- ADDED: Needed for frontend Edit modal
        c.CoachName                            AS AssignedCoach,
        m.PlanID,                              -- ADDED: Needed for frontend Edit modal
        mp.PlanDescription                     AS MembershipPlan,
        mp.Price                               AS PlanPrice,
        mp.Duration                            AS PlanDurationMonths,
        m.PlanStartDate,
        dbo.fn_GetPlanEndDate(m.MemberID)      AS PlanEndDate,
        dbo.fn_IsMemberPlanActive(m.MemberID)  AS PlanActive,
        dbo.fn_GetMemberClassCount(m.MemberID) AS ClassesAttended
    FROM Members m
    LEFT JOIN Coach c           ON m.CoachID = c.CoachID
    LEFT JOIN MembershipPlan mp ON m.PlanID  = mp.MembershipID
    WHERE m.MemberID = @MemberID
);
GO