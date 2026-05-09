CREATE TABLE MembershipPlan (
	MembershipID INT PRIMARY KEY,
	Duration INT CHECK (Duration > 0),
	Price INT CHECK (Price > 0),
	PlanDescription VARCHAR(200)
);

CREATE TABLE Coach (
	CoachID INT	PRIMARY KEY,
	CoachName VARCHAR(100) NOT NULL,
	CoachGender VARCHAR(10),
	Salary INT CHECK (Salary > 0),
	PhoneNumber VARCHAR(20) UNIQUE CHECK (PhoneNumber LIKE '01[0-9]%'),

	CHECK(CoachGender IN('Male','Female'))
);

CREATE TABLE Members (
	MemberID INT PRIMARY KEY,
	MemberName VARCHAR(100) NOT NULL,
	MemberGender VARCHAR(10),
	BirthDate DATE NOT NULL,
	PhoneNumber VARCHAR(20) UNIQUE CHECK (PhoneNumber LIKE '01[0-9]%'),
	WorkoutPlan VARCHAR(50),
	CoachID INT,
	PlanID INT,
	PlanStartDate DATE,

	FOREIGN KEY (PlanID) REFERENCES MembershipPlan(MembershipID),
	FOREIGN KEY (CoachID) REFERENCES Coach(CoachID),

	CHECK(BirthDate <= DATEADD(YEAR, -14, GETDATE())),
	CHECK(MemberGender IN('Male','Female'))
);

CREATE TABLE Class (
	ClassID INT PRIMARY KEY,
	ClassName VARCHAR(100) NOT NULL,
	Capacity INT CHECK (Capacity > 0),
	LeadingCoachID INT NOT NULL,

	FOREIGN KEY (LeadingCoachID) REFERENCES Coach(CoachID)
);

CREATE TABLE Branch_Manager (
	BranchID INT PRIMARY KEY,
	OpenHours VARCHAR(100),
	AddressStreet VARCHAR(50),
	AddressCity VARCHAR(50),
	ManagerID INT NOT NULL,
	ManagerName VARCHAR(100) NOT NULL,
	ManagerEmail VARCHAR(100) UNIQUE,
	ManagerPhoneNumber VARCHAR(20) UNIQUE CHECK (ManagerPhoneNumber LIKE '01[0-9]%')
);

CREATE TABLE Equipment (
	EquipmentID INT PRIMARY KEY,
	EquipmentType VARCHAR(100) 
);

CREATE TABLE MaintenanceLog (
	EquipmentID INT,
	LogDate DATE,
	LogDescription VARCHAR(200),

	PRIMARY KEY(EquipmentID,LogDate),

	FOREIGN KEY (EquipmentID) REFERENCES Equipment(EquipmentID)
);

CREATE TABLE Uses (
	MemberID INT,
	EquipmentID INT,


	PRIMARY KEY(MemberID,EquipmentID),

	FOREIGN KEY (MemberID) REFERENCES Members(MemberID),
	FOREIGN KEY (EquipmentID) REFERENCES Equipment(EquipmentID)
);

CREATE TABLE Contain (
	BranchID INT,
	EquipmentID INT,


	PRIMARY KEY(BranchID,EquipmentID),

	FOREIGN KEY (BranchID) REFERENCES Branch_Manager(BranchID),
	FOREIGN KEY (EquipmentID) REFERENCES Equipment(EquipmentID)
);

CREATE TABLE Host(
	ClassID INT,
	BranchID INT,
	Schedule VARCHAR(100),

	PRIMARY KEY(ClassID,BranchID),

	FOREIGN KEY (ClassID) REFERENCES Class(ClassID),
	FOREIGN KEY (BranchID) REFERENCES Branch_Manager(BranchID)
);

CREATE TABLE Attend (
	MemberID INT,
	ClassID INT,


	PRIMARY KEY(ClassID,MemberID),

	FOREIGN KEY (MemberID) REFERENCES Members(MemberID),
	FOREIGN KEY (ClassID) REFERENCES Class(ClassID)
);

CREATE TABLE CoachCertificate (
	CoachID INT,
	CertificateName VARCHAR(100),

	PRIMARY KEY(CoachID,CertificateName),

	FOREIGN KEY (CoachID) REFERENCES Coach(CoachID)
);

INSERT INTO MembershipPlan VALUES
(1, 1, 1200, 'Basic Monthly Plan'),
(2, 3, 2300, '3-Month Plan'),
(3, 6, 4500, 'Half Year Plan'),
(4, 12, 7500, 'Annual Plan');

INSERT INTO Coach VALUES
(1, 'Ahmed Ali', 'Male', 8000, '01012345678'),
(2, 'Sara Hassan', 'Female', 9000, '01098765432'),
(3, 'Omar Youssef', 'Male', 7500, '01111222333'),
(4, 'Mona Khaled', 'Female', 8500, '01055667788'),
(5, 'Khaled Nabil', 'Male', 7800, '01122334455'),
(6, 'Nour Ahmed', 'Female', 9200, '01233445566'),
(7, 'Yara Mostafa', 'Female', 8700, '01044556677'),
(8, 'Hassan Fathy', 'Male', 8100, '01166778899');

INSERT INTO Members VALUES
(1, 'Mohamed Samir', 'Male', '2005-06-10', '01234567890', 'Weight Loss', 1, 2, '2026-01-01'),
(2, 'Hadeer Ali', 'Female', '2000-03-15', '01022334455', 'Muscle Gain', 3, 3, '2025-12-15'),
(3, 'Youssef Tarek', 'Male', '2003-11-20', '01199887766', 'Fitness', 3, 1, '2026-04-02'),
(4, 'Ali Hassan', 'Male', '2004-02-12', '01011112222', 'Muscle Gain', 4, 2, '2026-02-01'),
(5, 'Salma Tarek', 'Female', '2002-08-25', '01033334444', 'Fitness', 5, 4, '2026-03-10'),
(6, 'Mostafa Adel', 'Male', '2000-05-30', '01155556666', 'Weight Loss', 6, 3, '2026-01-20'),
(7, 'Nadine Samy', 'Female', '2006-09-18', '01277778888', 'Yoga', 2, 2, '2026-04-01'),
(8, 'Karim Nabil', 'Male', '1999-07-14', '01099990000', 'CrossFit', 8, 2, '2026-02-20'),
(9, 'Laila Adel', 'Female', '2001-12-05', '01288889999', 'Pilates', 7, 2, '2026-03-01'),
(10, 'Omar Khaled', 'Male', '2002-01-10', '01010000001', 'Muscle Gain', 1, 3, '2026-02-01'),
(11, 'Farah Ahmed', 'Female', '2003-04-22', '01010000002', 'Yoga', 2, 2, '2026-03-01'),
(12, 'Mahmoud Tarek', 'Male', '1998-07-13', '01010000003', 'CrossFit', 3, 4, '2026-01-15'),
(13, 'Nourhan Ali', 'Female', '2001-09-30', '01010000004', 'Fitness', 4, 1, '2026-04-01'),
(14, 'Ahmed Samir', 'Male', '2000-11-05', '01010000005', 'Weight Loss', 5, 2, '2026-02-20'),
(15, 'Dina Hassan', 'Female', '2004-03-17', '01010000006', 'Pilates', 6, 3, '2026-01-25'),
(16, 'Karim Adel', 'Male', '1999-06-09', '01010000007', 'Strength', 7, 4, '2026-02-10'),
(17, 'Salma Mohamed', 'Female', '2005-12-12', '01010000008', 'Yoga', 2, 1, '2026-03-12'),
(18, 'Youssef Nabil', 'Male', '2002-08-19', '01010000009', 'HIIT', 5, 3, '2026-02-28'),
(19, 'Hana Adel', 'Female', '2003-02-11', '01010000010', 'Zumba', 6, 2, '2026-01-30'),
(20, 'Mostafa Samy', 'Male', '1997-05-14', '01010000011', 'Fitness', 8, 4, '2026-02-05'),
(21, 'Aya Khaled', 'Female', '2001-10-21', '01010000012', 'Yoga', 1, 2, '2026-03-08'),
(22, 'Tamer Hossam', 'Male', '1999-01-01', '01010000013', 'CrossFit', 3, 3, '2026-01-18'),
(23, 'Reem Nasser', 'Female', '2002-06-16', '01010000014', 'Pilates', 4, 2, '2026-02-27'),
(24, 'Sherif Ali', 'Male', '1998-09-09', '01010000015', 'Weight Loss', 5, 1, '2026-03-03'),
(25, 'Lina Mostafa', 'Female', '2004-07-07', '01010000016', 'Zumba', 6, 4, '2026-01-22'),
(26, 'Hossam Yasser', 'Male', '2000-12-25', '01010000017', 'Strength', 7, 3, '2026-02-14'),
(27, 'Mariam Adel', 'Female', '2003-03-03', '01010000018', 'Fitness', 8, 2, '2026-03-18'),
(28, 'Wael Fathy', 'Male', '1996-11-11', '01010000019', 'HIIT', 5, 3, '2026-01-29'),
(29, 'Nadine Khaled', 'Female', '2002-04-04', '01010000020', 'Yoga', 2, 1, '2026-02-09'),
(30, 'Adel Gamal', 'Male', '1995-08-08', '01010000021', 'Fitness', 1, 4, '2026-03-11'),
(31, 'Yara Samy', 'Female', '2001-05-05', '01010000022', 'Pilates', 4, 2, '2026-01-19'),
(32, 'Kareem Ashraf', 'Male', '1999-09-09', '01010000023', 'CrossFit', 3, 3, '2026-02-26'),
(33, 'Huda Nabil', 'Female', '2003-07-12', '01010000024', 'Zumba', 6, 1, '2026-03-06'),
(34, 'Ali Fathy', 'Male', '2000-10-10', '01010000025', 'Strength', 7, 1, '2026-02-02'),
(35, 'Mona Samir', 'Female', '2002-02-02', '01010000026', 'Yoga', 2, 2, '2026-03-25'),
(36, 'Omar Adel', 'Male', '1998-03-15', '01010000027', 'HIIT', 5, 3, '2026-01-21'),
(37, 'Sara Tarek', 'Female', '2004-06-06', '01010000028', 'Fitness', 8, 4, '2026-02-17'),
(38, 'Youssef Hassan', 'Male', '1997-01-20', '01010000029', 'CrossFit', 3, 2, '2026-03-02'),
(39, 'Nada Khaled', 'Female', '2001-11-11', '01010000030', 'Pilates', 4, 1, '2026-02-13');

INSERT INTO Class VALUES
(1, 'Yoga', 20, 2),
(2, 'CrossFit', 15, 3),
(3, 'Boxing', 15, 1),  
(4, 'Belly Dance', 17, 2),
(5, 'Pilates', 18, 4),
(6, 'HIIT', 20, 7),
(7, 'Zumba', 25, 6),
(8, 'Strength Training', 16, 8);

INSERT INTO Branch_Manager VALUES
(1, '8AM-12AM', 'Makram Ebeid Street', 'Nasr City', 1, 'Karim Adel Badr', 'karim.badr@hotmail.com', '01143456780'),
(2, '8AM-2AM', 'El Nozha Street', 'Heliopolis', 2, 'Dalia Mostafa El-Kholy', 'dalia.elkholy@yahoo.com', '01209876543'),
(3, '7AM-11PM', '90 Street', 'New Cairo', 3, 'Nader Samir El-Gendy', 'nader.elgendy@gmail.com', '01228765432');

INSERT INTO Equipment VALUES
(1,'Treadmill'),
(2,'Adjustable Dumbbells'),
(3,'Leg Extension Machine'),
(4,'Bench Press'),
(5,'Pull-Up Bar'),
(6,'Rowing Machine'),
(7,'Elliptical Trainer'),
(8,'Cable Machine'),
(9,'Smith Machine'),
(10,'Battle Ropes'),
(11,'Kettlebells'),
(12,'Stationary Bike'),
(13,'Hack Squat Machine'),
(14,'Lat Pulldown Machine'),
(15,'Chest Press Machine'),
(16,'Shoulder Press Machine'),
(17,'Leg Curl Machine'),
(18,'Abdominal Crunch Machine'),
(19,'Stair Climber'),
(20,'Ski Trainer'),
(21,'Trap Bar'),
(22,'Medicine Balls'),
(23,'Glute Bridge Machine'),
(24,'Dip Station'),
(25,'Resistance Bands');

INSERT INTO MaintenanceLog VALUES
(1, '2026-01-10', 'Belt replaced'),
(3, '2026-01-20', 'Frame tightened'),
(2, '2026-01-15', 'Weights calibrated'),
(4, '2026-02-10', 'Adjusted stability'),
(19,'2026-03-01','Motor serviced'),
(14,'2026-03-02','Cable replaced'),
(23,'2026-03-05','Hydraulics checked'),
(6, '2026-02-15', 'Chain lubricated'),
(7, '2026-02-18', 'Motor checked'),
(10, '2026-02-20', 'Rope replaced'),
(12, '2026-02-22', 'Pedal fixed');

INSERT INTO Uses VALUES
(1,2),(1,4),(1,7),(1,11),
(2,3),(2,6),(2,11),(2,8),
(3,1),(3,5),(3,9),(3,14),
(4,1),(4,2),(4,4),(4,6),(4,8),(4,9),(4,13),(4,14),(4,21),(4,23),
(5,6),(5,7),(5,12),(5,18),
(6,7),(6,8),(6,17),(6,20),
(7,2),(7,25),(7,18),
(8,1),(8,2),(8,3),(8,5),(8,6),(8,7),(8,9),(8,10),(8,12),(8,19),(8,21),
(9,12),(9,6),(9,22),
(10,13),(10,14),(10,4),(10,2),
(11,18),(11,12),(11,2),(11,6),
(12,1),(12,2),(12,4),(12,6),(12,8),(12,13),(12,14),(12,15),(12,17),(12,20),(12,22),
(13,15),(13,4),(13,8),(13,21),
(14,17),(14,2),(14,19),(14,9),
(15,18),(15,11),(15,24),(15,6),
(16,21),(16,4),(16,13),(16,9),(16,5),
(17,1),(17,18),(17,25),
(18,6),(18,20),(18,7),(18,10),
(19,22),(19,10),(19,5),(19,12),
(20,2),(20,3),(20,4),(20,5),(20,6),(20,7),(20,9),(20,11),(20,12),(20,16),(20,18),(20,24),
(21,1),(21,12),(21,2),(21,7),
(22,6),(22,14),(22,20),(22,2),(22,11),
(23,15),(23,18),(23,24),(23,4),
(24,2),(24,17),(24,4),
(25,22),(25,7),(25,10),(25,6),
(26,1),(26,2),(26,4),(26,6),(26,8),(26,9),(26,13),(26,14),(26,16),(26,21),(26,23),
(27,12),(27,8),(27,25),(27,2),
(28,20),(28,10),(28,6),(28,12),(28,7),
(29,1),(29,18),(29,2),
(30,4),(30,5),(30,9),(30,13),
(31,18),(31,12),(31,23),(31,6),
(32,6),(32,14),(32,20),(32,8),(32,3),
(33,22),(33,7),(33,10),(33,18),
(34,21),(34,16),(34,13),(34,4),(34,9),
(35,18),(35,11),(35,25),(35,2),(35,6),
(36,20),(36,6),(36,7),(36,14),
(37,12),(37,9),(37,8),(37,2),
(38,6),(38,14),(38,1),(38,9),
(39,15),(39,18),(39,24),(39,7);

INSERT INTO Contain VALUES
(1,1),(1,2),(1,3),(1,4),(1,5),(1,6),(1,7),(1,8),(1,25),
(2,2),(2,4),(2,5),(2,6),(2,7),(2,8),(2,9),(2,13),(2,25),
(3,2),(3,3),(3,4),(3,6),(3,10),(3,11),(3,12),(3,14),(3,25);

INSERT INTO Host VALUES
(5,1,'Tuesday 7:30PM'),
(2,1,'Sunday 5PM'),
(8,1,'Thursday 9PM'),
(1,1,'Friday 6:30PM'),
(4,1,'Monday 8PM'),
(6,2,'Wednesday 6:30PM'),
(3,2,'Saturday 7PM'),
(8,2,'Monday 9:15PM'),
(2,2,'Thursday 5:45PM'),
(7,3,'Friday 8PM'),
(1,3,'Tuesday 6PM'),
(5,3,'Sunday 7:30PM'),
(3,3,'Thursday 9:30PM');

INSERT INTO Attend VALUES
(1,1),(5,1),(7,1),(11,1),(17,1),
(21,1),(29,1),(30,1),(35,1),(13,1),
(14,1),(23,1),(31,1),(38,1),
(2,2),(6,2),(8,2),(10,2),(12,2),
(22,2),(27,2),(32,2),(35,2),(38,2),
(3,2),(9,2),(16,2),(20,2),(37,2),
(2,3),(8,3),(12,3),(22,3),(28,3),
(32,3),(33,3),(38,3),(36,3),(6,3),(20,3),
(4,4),(11,4),(16,4),(19,4),(23,4),
(26,4),(30,4),(34,4),(37,4),(39,4),
(5,4),(13,4),(18,4),
(5,5),(9,5),(15,5),(23,5),(31,5),
(39,5),(4,5),(11,5),(16,5),(24,5),
(25,5),(34,5),(35,5),(36,5),
(6,6),(10,6),(18,6),(20,6),(22,6),
(28,6),(33,6),(36,6),(12,6),(14,6),
(19,6),(21,6),(25,6),(31,6),(38,6),
(7,7),(19,7),(25,7),(27,7),(33,7),
(34,7),(37,7),(8,7),(11,7),(15,7),
(18,7),(20,7),(29,7),(30,7),(35,7),
(8,8),(16,8),(20,8),(26,8),(27,8),
(34,8),(37,8),(12,8),(22,8),(28,8),
(32,8),(39,8);

INSERT INTO CoachCertificate VALUES
(1, 'Nutrition Specialist'),
(2, 'Strength Coach Certification'),
(3, 'Fitness Trainer Level 1'),
(4, 'Pilates Instructor'),
(5, 'HIIT Specialist'),
(6, 'Zumba Instructor'),
(7, 'Spinning Coach Certification');