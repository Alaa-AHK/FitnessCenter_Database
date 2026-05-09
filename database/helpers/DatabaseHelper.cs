using System;
using System.Data;
using System.Data.SqlClient;

namespace FitnessCenter
{

    // Every public method follows the same pattern:
    //   1. Build the SQL command (parameterised – no string concat)
    //   2. Open connection inside a try block
    //   3. Execute and return the result
    //   4. Catch SqlException for DB errors, Exception for anything else
    //   5. Always close the connection in finally

    public class DatabaseHelper
    {
        // CONNECTION STRING
            private readonly string _connectionString =
            @"Server=DESKTOP-4I814ME\SQLEXPRESS;Database=FitnessCenterDB;Integrated Security=True;";

        // Members

        /// Returns all members with their assigned coach and plan.
        /// Suitable for populating a GridView / DataGridView on the Members form.
        public DataTable GetAllMembers()
        {
            DataTable dt = new DataTable();
            string query = @"
                SELECT  m.MemberID,
                        m.MemberName,
                        m.MemberGender,
                        m.BirthDate,
                        m.PhoneNumber,
                        m.WorkoutPlan,
                        c.CoachName        AS AssignedCoach,
                        mp.PlanDescription AS MembershipPlan,
                        m.PlanStartDate,
                        dbo.fn_GetMemberAge(m.MemberID)      AS Age,
                        dbo.fn_GetPlanEndDate(m.MemberID)    AS PlanEndDate,
                        dbo.fn_IsMemberPlanActive(m.MemberID)AS PlanActive
                FROM    Members m
                LEFT JOIN Coach          c  ON m.CoachID = c.CoachID
                LEFT JOIN MembershipPlan mp ON m.PlanID  = mp.MembershipID
                ORDER BY m.MemberID;";

            SqlConnection connection = new SqlConnection(_connectionString);
            try
            {
                connection.Open();
                SqlCommand    command = new SqlCommand(query, connection);
                SqlDataAdapter adapter = new SqlDataAdapter(command);
                adapter.Fill(dt);
            }
            catch (SqlException ex)
            {
                throw new Exception("Database error while loading members: " + ex.Message, ex);
            }
            finally
            {
                connection.Close();
            }
            return dt;
        }

        // Returns a full profile of one member using the fn_GetMemberProfile TVF.
        public DataTable GetMemberProfile(int memberID)
        {
            DataTable dt = new DataTable();
            string query = "SELECT * FROM dbo.fn_GetMemberProfile(@MemberID);";

            SqlConnection connection = new SqlConnection(_connectionString);
            try
            {
                connection.Open();
                SqlCommand command = new SqlCommand(query, connection);
                command.Parameters.AddWithValue("@MemberID", memberID);
                SqlDataAdapter adapter = new SqlDataAdapter(command);
                adapter.Fill(dt);
            }
            catch (SqlException ex)
            {
                throw new Exception("Database error while loading member profile: " + ex.Message, ex);
            }
            finally
            {
                connection.Close();
            }
            return dt;
        }

        /// Inserts a new member record.
        /// Returns the number of rows affected (should be 1 on success).
        public int InsertMember(string name, string gender, DateTime birthDate,
                                string phone, string workoutPlan,
                                int? coachID, int? planID, DateTime? planStartDate)
        {
            string query = @"
                INSERT INTO Members
                    (MemberID, MemberName, MemberGender, BirthDate,
                     PhoneNumber, WorkoutPlan, CoachID, PlanID, PlanStartDate)
                VALUES
                    ((SELECT ISNULL(MAX(MemberID),0)+1 FROM Members),
                     @Name, @Gender, @BirthDate,
                     @Phone, @WorkoutPlan, @CoachID, @PlanID, @PlanStartDate);";

            SqlConnection connection = new SqlConnection(_connectionString);
            try
            {
                connection.Open();
                SqlCommand command = new SqlCommand(query, connection);
                command.Parameters.AddWithValue("@Name",         name);
                command.Parameters.AddWithValue("@Gender",       gender);
                command.Parameters.AddWithValue("@BirthDate",    birthDate);
                command.Parameters.AddWithValue("@Phone",        phone);
                command.Parameters.AddWithValue("@WorkoutPlan",  workoutPlan ?? (object)DBNull.Value);
                command.Parameters.AddWithValue("@CoachID",      coachID.HasValue ? (object)coachID.Value : DBNull.Value);
                command.Parameters.AddWithValue("@PlanID",       planID.HasValue  ? (object)planID.Value  : DBNull.Value);
                command.Parameters.AddWithValue("@PlanStartDate",planStartDate.HasValue ? (object)planStartDate.Value : DBNull.Value);
                return command.ExecuteNonQuery();
            }
            catch (SqlException ex)
            {
                // Friendly messages for common constraint violations
                if (ex.Number == 2627 || ex.Number == 2601)
                    throw new Exception("A member with this phone number already exists.", ex);
                throw new Exception("Database error while adding member: " + ex.Message, ex);
            }
            finally
            {
                connection.Close();
            }
        }

        // Updates an existing member's details.
        public int UpdateMember(int memberID, string name, string gender,
                                string phone, string workoutPlan,
                                int? coachID, int? planID, DateTime? planStartDate)
        {
            string query = @"
                UPDATE Members SET
                    MemberName    = @Name,
                    MemberGender  = @Gender,
                    PhoneNumber   = @Phone,
                    WorkoutPlan   = @WorkoutPlan,
                    CoachID       = @CoachID,
                    PlanID        = @PlanID,
                    PlanStartDate = @PlanStartDate
                WHERE MemberID = @MemberID;";

            SqlConnection connection = new SqlConnection(_connectionString);
            try
            {
                connection.Open();
                SqlCommand command = new SqlCommand(query, connection);
                command.Parameters.AddWithValue("@MemberID",    memberID);
                command.Parameters.AddWithValue("@Name",        name);
                command.Parameters.AddWithValue("@Gender",      gender);
                command.Parameters.AddWithValue("@Phone",       phone);
                command.Parameters.AddWithValue("@WorkoutPlan", workoutPlan ?? (object)DBNull.Value);
                command.Parameters.AddWithValue("@CoachID",     coachID.HasValue ? (object)coachID.Value : DBNull.Value);
                command.Parameters.AddWithValue("@PlanID",      planID.HasValue  ? (object)planID.Value  : DBNull.Value);
                command.Parameters.AddWithValue("@PlanStartDate",planStartDate.HasValue ? (object)planStartDate.Value : DBNull.Value);
                return command.ExecuteNonQuery();
            }
            catch (SqlException ex)
            {
                if (ex.Number == 2627 || ex.Number == 2601)
                    throw new Exception("Another member already has this phone number.", ex);
                throw new Exception("Database error while updating member: " + ex.Message, ex);
            }
            finally
            {
                connection.Close();
            }
        }

        /// Deletes a member and their attendance / equipment-use records.
        /// Uses a transaction so either everything succeeds or nothing changes.
        public int DeleteMember(int memberID)
        {
            SqlConnection connection = new SqlConnection(_connectionString);
            SqlTransaction transaction = null;
            try
            {
                connection.Open();
                transaction = connection.BeginTransaction();

                // Remove dependent rows first (FK constraints)
                new SqlCommand("DELETE FROM Attend WHERE MemberID = @ID;", connection, transaction)
                    { Parameters = { new SqlParameter("@ID", memberID) } }
                    .ExecuteNonQuery();

                new SqlCommand("DELETE FROM Uses WHERE MemberID = @ID;", connection, transaction)
                    { Parameters = { new SqlParameter("@ID", memberID) } }
                    .ExecuteNonQuery();

                SqlCommand delCmd = new SqlCommand(
                    "DELETE FROM Members WHERE MemberID = @ID;", connection, transaction);
                delCmd.Parameters.AddWithValue("@ID", memberID);
                int rows = delCmd.ExecuteNonQuery();

                transaction.Commit();
                return rows;
            }
            catch (SqlException ex)
            {
                transaction?.Rollback();
                throw new Exception("Database error while deleting member: " + ex.Message, ex);
            }
            finally
            {
                connection.Close();
            }
        }

        /// Searches members by partial name match.
        public DataTable SearchMembersByName(string namePart)
        {
            DataTable dt = new DataTable();
            string query = @"
                SELECT m.MemberID, m.MemberName, m.MemberGender,
                       dbo.fn_GetMemberAge(m.MemberID) AS Age,
                       m.PhoneNumber, m.WorkoutPlan,
                       c.CoachName AS AssignedCoach
                FROM   Members m
                LEFT JOIN Coach c ON m.CoachID = c.CoachID
                WHERE  m.MemberName LIKE @Name
                ORDER BY m.MemberName;";

            SqlConnection connection = new SqlConnection(_connectionString);
            try
            {
                connection.Open();
                SqlCommand command = new SqlCommand(query, connection);
                command.Parameters.AddWithValue("@Name", "%" + namePart + "%");
                new SqlDataAdapter(command).Fill(dt);
            }
            catch (SqlException ex)
            {
                throw new Exception("Database error while searching members: " + ex.Message, ex);
            }
            finally
            {
                connection.Close();
            }
            return dt;
        }

        // Coaches
    
        /// Returns all coaches with their member count and class count.
        public DataTable GetAllCoaches()
        {
            DataTable dt = new DataTable();
            string query = @"
                SELECT  c.CoachID,
                        c.CoachName,
                        c.CoachGender,
                        c.Salary,
                        c.PhoneNumber,
                        dbo.fn_GetCoachMemberCount(c.CoachID)      AS MembersCount,
                        dbo.fn_GetCoachClassCount(c.CoachID)       AS ClassesLed,
                        dbo.fn_GetCoachCertificateCount(c.CoachID) AS Certificates
                FROM    Coach c
                ORDER BY c.CoachID;";

            SqlConnection connection = new SqlConnection(_connectionString);
            try
            {
                connection.Open();
                new SqlDataAdapter(new SqlCommand(query, connection)).Fill(dt);
            }
            catch (SqlException ex)
            {
                throw new Exception("Database error while loading coaches: " + ex.Message, ex);
            }
            finally
            {
                connection.Close();
            }
            return dt;
        }

        /// Returns all members assigned to a specific coach (uses TVF).
        public DataTable GetMembersByCoach(int coachID)
        {
            DataTable dt = new DataTable();
            string query = "SELECT * FROM dbo.fn_GetCoachMembers(@CoachID);";

            SqlConnection connection = new SqlConnection(_connectionString);
            try
            {
                connection.Open();
                SqlCommand command = new SqlCommand(query, connection);
                command.Parameters.AddWithValue("@CoachID", coachID);
                new SqlDataAdapter(command).Fill(dt);
            }
            catch (SqlException ex)
            {
                throw new Exception("Database error while loading coach members: " + ex.Message, ex);
            }
            finally
            {
                connection.Close();
            }
            return dt;
        }

        /// Inserts a new coach.
        public int InsertCoach(string name, string gender, int salary, string phone)
        {
            string query = @"
                INSERT INTO Coach (CoachID, CoachName, CoachGender, Salary, PhoneNumber)
                VALUES ((SELECT ISNULL(MAX(CoachID),0)+1 FROM Coach),
                        @Name, @Gender, @Salary, @Phone);";

            SqlConnection connection = new SqlConnection(_connectionString);
            try
            {
                connection.Open();
                SqlCommand command = new SqlCommand(query, connection);
                command.Parameters.AddWithValue("@Name",   name);
                command.Parameters.AddWithValue("@Gender", gender);
                command.Parameters.AddWithValue("@Salary", salary);
                command.Parameters.AddWithValue("@Phone",  phone);
                return command.ExecuteNonQuery();
            }
            catch (SqlException ex)
            {
                if (ex.Number == 2627 || ex.Number == 2601)
                    throw new Exception("A coach with this phone number already exists.", ex);
                throw new Exception("Database error while adding coach: " + ex.Message, ex);
            }
            finally
            {
                connection.Close();
            }
        }

        /// Updates an existing coach record.
        public int UpdateCoach(int coachID, string name, string gender, int salary, string phone)
        {
            string query = @"
                UPDATE Coach SET
                    CoachName   = @Name,
                    CoachGender = @Gender,
                    Salary      = @Salary,
                    PhoneNumber = @Phone
                WHERE CoachID = @CoachID;";

            SqlConnection connection = new SqlConnection(_connectionString);
            try
            {
                connection.Open();
                SqlCommand command = new SqlCommand(query, connection);
                command.Parameters.AddWithValue("@CoachID", coachID);
                command.Parameters.AddWithValue("@Name",    name);
                command.Parameters.AddWithValue("@Gender",  gender);
                command.Parameters.AddWithValue("@Salary",  salary);
                command.Parameters.AddWithValue("@Phone",   phone);
                return command.ExecuteNonQuery();
            }
            catch (SqlException ex)
            {
                throw new Exception("Database error while updating coach: " + ex.Message, ex);
            }
            finally
            {
                connection.Close();
            }
        }

        /// Deletes a coach. Fails if members are still assigned to this coach —
        /// re-assign them first (the caller should check and warn the user).
        public int DeleteCoach(int coachID)
        {
            SqlConnection connection = new SqlConnection(_connectionString);
            SqlTransaction transaction = null;
            try
            {
                connection.Open();
                transaction = connection.BeginTransaction();

                // Remove certificates first
                new SqlCommand("DELETE FROM CoachCertificate WHERE CoachID = @ID;", connection, transaction)
                    { Parameters = { new SqlParameter("@ID", coachID) } }
                    .ExecuteNonQuery();

                SqlCommand delCmd = new SqlCommand(
                    "DELETE FROM Coach WHERE CoachID = @ID;", connection, transaction);
                delCmd.Parameters.AddWithValue("@ID", coachID);
                int rows = delCmd.ExecuteNonQuery();

                transaction.Commit();
                return rows;
            }
            catch (SqlException ex)
            {
                transaction?.Rollback();
                if (ex.Number == 547)
                    throw new Exception(
                        "Cannot delete this coach because members or classes are still assigned to them. " +
                        "Re-assign them first.", ex);
                throw new Exception("Database error while deleting coach: " + ex.Message, ex);
            }
            finally
            {
                connection.Close();
            }
        }

        /// Adds a certificate to a coach.
        public int AddCoachCertificate(int coachID, string certificateName)
        {
            string query = @"
                INSERT INTO CoachCertificate (CoachID, CertificateName)
                VALUES (@CoachID, @CertName);";

            SqlConnection connection = new SqlConnection(_connectionString);
            try
            {
                connection.Open();
                SqlCommand command = new SqlCommand(query, connection);
                command.Parameters.AddWithValue("@CoachID",   coachID);
                command.Parameters.AddWithValue("@CertName",  certificateName);
                return command.ExecuteNonQuery();
            }
            catch (SqlException ex)
            {
                if (ex.Number == 2627 || ex.Number == 2601)
                    throw new Exception("This coach already has that certificate.", ex);
                throw new Exception("Database error while adding certificate: " + ex.Message, ex);
            }
            finally
            {
                connection.Close();
            }
        }

        /// Returns all certificates held by a coach.
        public DataTable GetCoachCertificates(int coachID)
        {
            DataTable dt = new DataTable();
            string query = "SELECT CertificateName FROM CoachCertificate WHERE CoachID = @CoachID;";

            SqlConnection connection = new SqlConnection(_connectionString);
            try
            {
                connection.Open();
                SqlCommand command = new SqlCommand(query, connection);
                command.Parameters.AddWithValue("@CoachID", coachID);
                new SqlDataAdapter(command).Fill(dt);
            }
            catch (SqlException ex)
            {
                throw new Exception("Database error while loading certificates: " + ex.Message, ex);
            }
            finally
            {
                connection.Close();
            }
            return dt;
        }

        // CLASSES

        /// Returns all classes with attendance count and available spots.
        public DataTable GetAllClasses()
        {
            DataTable dt = new DataTable();
            string query = @"
                SELECT  cl.ClassID,
                        cl.ClassName,
                        cl.Capacity,
                        c.CoachName                                AS LeadingCoach,
                        dbo.fn_GetClassAttendanceCount(cl.ClassID) AS Attendees,
                        dbo.fn_GetClassAvailableSpots(cl.ClassID)  AS AvailableSpots,
                        dbo.fn_IsClassFull(cl.ClassID)             AS IsFull
                FROM    Class cl
                JOIN    Coach c ON cl.LeadingCoachID = c.CoachID
                ORDER BY cl.ClassID;";

            SqlConnection connection = new SqlConnection(_connectionString);
            try
            {
                connection.Open();
                new SqlDataAdapter(new SqlCommand(query, connection)).Fill(dt);
            }
            catch (SqlException ex)
            {
                throw new Exception("Database error while loading classes: " + ex.Message, ex);
            }
            finally
            {
                connection.Close();
            }
            return dt;
        }

        // Returns all classes attended by a specific member (uses TVF).
        public DataTable GetClassesByMember(int memberID)
        {
            DataTable dt = new DataTable();
            string query = "SELECT * FROM dbo.fn_GetMemberClasses(@MemberID);";

            SqlConnection connection = new SqlConnection(_connectionString);
            try
            {
                connection.Open();
                SqlCommand command = new SqlCommand(query, connection);
                command.Parameters.AddWithValue("@MemberID", memberID);
                new SqlDataAdapter(command).Fill(dt);
            }
            catch (SqlException ex)
            {
                throw new Exception("Database error while loading member classes: " + ex.Message, ex);
            }
            finally
            {
                connection.Close();
            }
            return dt;
        }

        // Enrolls a member in a class after checking capacity.
        // Returns true if enrolment succeeded, false if the class is full.
        public bool EnrollMemberInClass(int memberID, int classID)
        {
            SqlConnection connection = new SqlConnection(_connectionString);
            SqlTransaction transaction = null;
            try
            {
                connection.Open();
                transaction = connection.BeginTransaction();

                // Check capacity using the scalar function
                SqlCommand checkCmd = new SqlCommand(
                    "SELECT dbo.fn_IsClassFull(@ClassID);", connection, transaction);
                checkCmd.Parameters.AddWithValue("@ClassID", classID);
                bool isFull = (bool)checkCmd.ExecuteScalar();

                if (isFull)
                {
                    transaction.Rollback();
                    return false;           // Let the UI show "Class is full"
                }

                SqlCommand insertCmd = new SqlCommand(
                    "INSERT INTO Attend (MemberID, ClassID) VALUES (@MemberID, @ClassID);",
                    connection, transaction);
                insertCmd.Parameters.AddWithValue("@MemberID", memberID);
                insertCmd.Parameters.AddWithValue("@ClassID",  classID);
                insertCmd.ExecuteNonQuery();

                transaction.Commit();
                return true;
            }
            catch (SqlException ex)
            {
                transaction?.Rollback();
                if (ex.Number == 2627 || ex.Number == 2601)
                    throw new Exception("This member is already enrolled in that class.", ex);
                throw new Exception("Database error while enrolling member: " + ex.Message, ex);
            }
            finally
            {
                connection.Close();
            }
        }

        // Removes a member from a class.
        public int UnenrollMemberFromClass(int memberID, int classID)
        {
            string query = "DELETE FROM Attend WHERE MemberID = @MemberID AND ClassID = @ClassID;";
            SqlConnection connection = new SqlConnection(_connectionString);
            try
            {
                connection.Open();
                SqlCommand command = new SqlCommand(query, connection);
                command.Parameters.AddWithValue("@MemberID", memberID);
                command.Parameters.AddWithValue("@ClassID",  classID);
                return command.ExecuteNonQuery();
            }
            catch (SqlException ex)
            {
                throw new Exception("Database error while removing enrolment: " + ex.Message, ex);
            }
            finally
            {
                connection.Close();
            }
        }

        // Inserts a new class.
        public int InsertClass(string name, int capacity, int leadingCoachID)
        {
            string query = @"
                INSERT INTO Class (ClassID, ClassName, Capacity, LeadingCoachID)
                VALUES ((SELECT ISNULL(MAX(ClassID),0)+1 FROM Class),
                        @Name, @Capacity, @CoachID);";

            SqlConnection connection = new SqlConnection(_connectionString);
            try
            {
                connection.Open();
                SqlCommand command = new SqlCommand(query, connection);
                command.Parameters.AddWithValue("@Name",     name);
                command.Parameters.AddWithValue("@Capacity", capacity);
                command.Parameters.AddWithValue("@CoachID",  leadingCoachID);
                return command.ExecuteNonQuery();
            }
            catch (SqlException ex)
            {
                throw new Exception("Database error while adding class: " + ex.Message, ex);
            }
            finally
            {
                connection.Close();
            }
        }

        // Updates an existing class.
        public int UpdateClass(int classID, string name, int capacity, int leadingCoachID)
        {
            string query = @"
                UPDATE Class SET
                    ClassName      = @Name,
                    Capacity       = @Capacity,
                    LeadingCoachID = @CoachID
                WHERE ClassID = @ClassID;";

            SqlConnection connection = new SqlConnection(_connectionString);
            try
            {
                connection.Open();
                SqlCommand command = new SqlCommand(query, connection);
                command.Parameters.AddWithValue("@ClassID",  classID);
                command.Parameters.AddWithValue("@Name",     name);
                command.Parameters.AddWithValue("@Capacity", capacity);
                command.Parameters.AddWithValue("@CoachID",  leadingCoachID);
                return command.ExecuteNonQuery();
            }
            catch (SqlException ex)
            {
                throw new Exception("Database error while updating class: " + ex.Message, ex);
            }
            finally
            {
                connection.Close();
            }
        }

        // BRANCHES

        // Returns all branches with class count and equipment count.
        public DataTable GetAllBranches()
        {
            DataTable dt = new DataTable();
            string query = @"
                SELECT  bm.BranchID,
                        bm.AddressCity + ', ' + bm.AddressStreet AS Location,
                        bm.OpenHours,
                        bm.ManagerName,
                        bm.ManagerEmail,
                        bm.ManagerPhoneNumber,
                        dbo.fn_GetBranchClassCount(bm.BranchID)    AS ClassesHosted,
                        dbo.fn_GetBranchEquipmentCount(bm.BranchID)AS EquipmentCount
                FROM    Branch_Manager bm
                ORDER BY bm.BranchID;";

            SqlConnection connection = new SqlConnection(_connectionString);
            try
            {
                connection.Open();
                new SqlDataAdapter(new SqlCommand(query, connection)).Fill(dt);
            }
            catch (SqlException ex)
            {
                throw new Exception("Database error while loading branches: " + ex.Message, ex);
            }
            finally
            {
                connection.Close();
            }
            return dt;
        }

        // Returns all equipment in a branch with last maintenance date (uses TVF).
        public DataTable GetEquipmentByBranch(int branchID)
        {
            DataTable dt = new DataTable();
            string query = "SELECT * FROM dbo.fn_GetBranchEquipment(@BranchID);";

            SqlConnection connection = new SqlConnection(_connectionString);
            try
            {
                connection.Open();
                SqlCommand command = new SqlCommand(query, connection);
                command.Parameters.AddWithValue("@BranchID", branchID);
                new SqlDataAdapter(command).Fill(dt);
            }
            catch (SqlException ex)
            {
                throw new Exception("Database error while loading branch equipment: " + ex.Message, ex);
            }
            finally
            {
                connection.Close();
            }
            return dt;
        }

        // Updates a branch's operating hours.
        public int UpdateBranchHours(int branchID, string openHours)
        {
            string query = "UPDATE Branch_Manager SET OpenHours = @Hours WHERE BranchID = @BranchID;";

            SqlConnection connection = new SqlConnection(_connectionString);
            try
            {
                connection.Open();
                SqlCommand command = new SqlCommand(query, connection);
                command.Parameters.AddWithValue("@BranchID", branchID);
                command.Parameters.AddWithValue("@Hours",    openHours);
                return command.ExecuteNonQuery();
            }
            catch (SqlException ex)
            {
                throw new Exception("Database error while updating branch hours: " + ex.Message, ex);
            }
            finally
            {
                connection.Close();
            }
        }

        // Updates a branch manager's contact details.
        public int UpdateBranchManager(int branchID, string managerName,
                                       string managerEmail, string managerPhone)
        {
            string query = @"
                UPDATE Branch_Manager SET
                    ManagerName         = @Name,
                    ManagerEmail        = @Email,
                    ManagerPhoneNumber  = @Phone
                WHERE BranchID = @BranchID;";

            SqlConnection connection = new SqlConnection(_connectionString);
            try
            {
                connection.Open();
                SqlCommand command = new SqlCommand(query, connection);
                command.Parameters.AddWithValue("@BranchID", branchID);
                command.Parameters.AddWithValue("@Name",     managerName);
                command.Parameters.AddWithValue("@Email",    managerEmail);
                command.Parameters.AddWithValue("@Phone",    managerPhone);
                return command.ExecuteNonQuery();
            }
            catch (SqlException ex)
            {
                if (ex.Number == 2627 || ex.Number == 2601)
                    throw new Exception("Another manager already uses that email or phone number.", ex);
                throw new Exception("Database error while updating manager: " + ex.Message, ex);
            }
            finally
            {
                connection.Close();
            }
        }

        // EQUIPMENT & MAINTENANCE

        // Returns all equipment with last maintenance date.
        public DataTable GetAllEquipment()
        {
            DataTable dt = new DataTable();
            string query = @"
                SELECT  e.EquipmentID,
                        e.EquipmentType,
                        dbo.fn_GetLastMaintenanceDate(e.EquipmentID) AS LastMaintained
                FROM    Equipment e
                ORDER BY e.EquipmentID;";

            SqlConnection connection = new SqlConnection(_connectionString);
            try
            {
                connection.Open();
                new SqlDataAdapter(new SqlCommand(query, connection)).Fill(dt);
            }
            catch (SqlException ex)
            {
                throw new Exception("Database error while loading equipment: " + ex.Message, ex);
            }
            finally
            {
                connection.Close();
            }
            return dt;
        }

        // Adds a new maintenance log entry for a piece of equipment.
        public int AddMaintenanceLog(int equipmentID, DateTime logDate, string description)
        {
            string query = @"
                INSERT INTO MaintenanceLog (EquipmentID, LogDate, LogDescription)
                VALUES (@EquipmentID, @LogDate, @Description);";

            SqlConnection connection = new SqlConnection(_connectionString);
            try
            {
                connection.Open();
                SqlCommand command = new SqlCommand(query, connection);
                command.Parameters.AddWithValue("@EquipmentID",  equipmentID);
                command.Parameters.AddWithValue("@LogDate",      logDate);
                command.Parameters.AddWithValue("@Description",  description);
                return command.ExecuteNonQuery();
            }
            catch (SqlException ex)
            {
                if (ex.Number == 2627 || ex.Number == 2601)
                    throw new Exception("A maintenance log for this equipment on that date already exists.", ex);
                throw new Exception("Database error while adding maintenance log: " + ex.Message, ex);
            }
            finally
            {
                connection.Close();
            }
        }

        // Returns the full maintenance history for one piece of equipment.
        public DataTable GetMaintenanceHistory(int equipmentID)
        {
            DataTable dt = new DataTable();
            string query = @"
                SELECT  LogDate, LogDescription
                FROM    MaintenanceLog
                WHERE   EquipmentID = @EquipmentID
                ORDER BY LogDate DESC;";

            SqlConnection connection = new SqlConnection(_connectionString);
            try
            {
                connection.Open();
                SqlCommand command = new SqlCommand(query, connection);
                command.Parameters.AddWithValue("@EquipmentID", equipmentID);
                new SqlDataAdapter(command).Fill(dt);
            }
            catch (SqlException ex)
            {
                throw new Exception("Database error while loading maintenance history: " + ex.Message, ex);
            }
            finally
            {
                connection.Close();
            }
            return dt;
        }

        // Assigns an existing piece of equipment to a branch.
        public int AssignEquipmentToBranch(int branchID, int equipmentID)
        {
            string query = "INSERT INTO Contain (BranchID, EquipmentID) VALUES (@BranchID, @EquipID);";
            SqlConnection connection = new SqlConnection(_connectionString);
            try
            {
                connection.Open();
                SqlCommand command = new SqlCommand(query, connection);
                command.Parameters.AddWithValue("@BranchID", branchID);
                command.Parameters.AddWithValue("@EquipID",  equipmentID);
                return command.ExecuteNonQuery();
            }
            catch (SqlException ex)
            {
                if (ex.Number == 2627 || ex.Number == 2601)
                    throw new Exception("This equipment is already assigned to that branch.", ex);
                throw new Exception("Database error while assigning equipment: " + ex.Message, ex);
            }
            finally
            {
                connection.Close();
            }
        }

        // MEMBERSHIP PLANS

        // Returns all membership plans with normalised annual cost.
        public DataTable GetAllMembershipPlans()
        {
            DataTable dt = new DataTable();
            string query = @"
                SELECT  MembershipID,
                        PlanDescription,
                        Duration,
                        Price,
                        dbo.fn_GetAnnualCost(MembershipID) AS AnnualCost
                FROM    MembershipPlan
                ORDER BY Duration;";

            SqlConnection connection = new SqlConnection(_connectionString);
            try
            {
                connection.Open();
                new SqlDataAdapter(new SqlCommand(query, connection)).Fill(dt);
            }
            catch (SqlException ex)
            {
                throw new Exception("Database error while loading membership plans: " + ex.Message, ex);
            }
            finally
            {
                connection.Close();
            }
            return dt;
        }

        // Inserts a new membership plan.
        public int InsertMembershipPlan(int duration, int price, string description)
        {
            string query = @"
                INSERT INTO MembershipPlan (MembershipID, Duration, Price, PlanDescription)
                VALUES ((SELECT ISNULL(MAX(MembershipID),0)+1 FROM MembershipPlan),
                        @Duration, @Price, @Description);";

            SqlConnection connection = new SqlConnection(_connectionString);
            try
            {
                connection.Open();
                SqlCommand command = new SqlCommand(query, connection);
                command.Parameters.AddWithValue("@Duration",    duration);
                command.Parameters.AddWithValue("@Price",       price);
                command.Parameters.AddWithValue("@Description", description);
                return command.ExecuteNonQuery();
            }
            catch (SqlException ex)
            {
                throw new Exception("Database error while adding membership plan: " + ex.Message, ex);
            }
            finally
            {
                connection.Close();
            }
        }

        // Updates an existing membership plan's price and description.
        public int UpdateMembershipPlan(int planID, int duration, int price, string description)
        {
            string query = @"
                UPDATE MembershipPlan SET
                    Duration        = @Duration,
                    Price           = @Price,
                    PlanDescription = @Description
                WHERE MembershipID = @PlanID;";

            SqlConnection connection = new SqlConnection(_connectionString);
            try
            {
                connection.Open();
                SqlCommand command = new SqlCommand(query, connection);
                command.Parameters.AddWithValue("@PlanID",      planID);
                command.Parameters.AddWithValue("@Duration",    duration);
                command.Parameters.AddWithValue("@Price",       price);
                command.Parameters.AddWithValue("@Description", description);
                return command.ExecuteNonQuery();
            }
            catch (SqlException ex)
            {
                throw new Exception("Database error while updating membership plan: " + ex.Message, ex);
            }
            finally
            {
                connection.Close();
            }
        }


        // HELPER / LOOKUP METHODS
        // (used to populate ComboBoxes / DropDownLists in the UI)

        // Returns CoachID + CoachName for every coach.
        // Bind to a ComboBox: DisplayMember = "CoachName", ValueMember = "CoachID"
        public DataTable GetCoachList()
        {
            DataTable dt = new DataTable();
            string query = "SELECT CoachID, CoachName FROM Coach ORDER BY CoachName;";
            SqlConnection connection = new SqlConnection(_connectionString);
            try
            {
                connection.Open();
                new SqlDataAdapter(new SqlCommand(query, connection)).Fill(dt);
            }
            catch (SqlException ex)
            {
                throw new Exception("Database error while loading coach list: " + ex.Message, ex);
            }
            finally
            {
                connection.Close();
            }
            return dt;
        }

        // Returns MembershipID + PlanDescription for every plan.
        // Bind to a ComboBox: DisplayMember = "PlanDescription", ValueMember = "MembershipID"
        public DataTable GetPlanList()
        {
            DataTable dt = new DataTable();
            string query = "SELECT MembershipID, PlanDescription FROM MembershipPlan ORDER BY Duration;";
            SqlConnection connection = new SqlConnection(_connectionString);
            try
            {
                connection.Open();
                new SqlDataAdapter(new SqlCommand(query, connection)).Fill(dt);
            }
            catch (SqlException ex)
            {
                throw new Exception("Database error while loading plan list: " + ex.Message, ex);
            }
            finally
            {
                connection.Close();
            }
            return dt;
        }

        // Returns ClassID + ClassName for every class.
        // Bind to a ComboBox: DisplayMember = "ClassName", ValueMember = "ClassID"
        public DataTable GetClassList()
        {
            DataTable dt = new DataTable();
            string query = "SELECT ClassID, ClassName FROM Class ORDER BY ClassName;";
            SqlConnection connection = new SqlConnection(_connectionString);
            try
            {
                connection.Open();
                new SqlDataAdapter(new SqlCommand(query, connection)).Fill(dt);
            }
            catch (SqlException ex)
            {
                throw new Exception("Database error while loading class list: " + ex.Message, ex);
            }
            finally
            {
                connection.Close();
            }
            return dt;
        }

        // Returns BranchID + Location string for every branch.
        // Bind to a ComboBox: DisplayMember = "Location", ValueMember = "BranchID"
        public DataTable GetBranchList()
        {
            DataTable dt = new DataTable();
            string query = @"
                SELECT BranchID,
                       AddressCity + ' – ' + AddressStreet AS Location
                FROM   Branch_Manager
                ORDER BY BranchID;";
            SqlConnection connection = new SqlConnection(_connectionString);
            try
            {
                connection.Open();
                new SqlDataAdapter(new SqlCommand(query, connection)).Fill(dt);
            }
            catch (SqlException ex)
            {
                throw new Exception("Database error while loading branch list: " + ex.Message, ex);
            }
            finally
            {
                connection.Close();
            }
            return dt;
        }

        // Returns EquipmentID + EquipmentType for every piece of equipment.
        // Bind to a ComboBox: DisplayMember = "EquipmentType", ValueMember = "EquipmentID"
        public DataTable GetEquipmentList()
        {
            DataTable dt = new DataTable();
            string query = "SELECT EquipmentID, EquipmentType FROM Equipment ORDER BY EquipmentType;";
            SqlConnection connection = new SqlConnection(_connectionString);
            try
            {
                connection.Open();
                new SqlDataAdapter(new SqlCommand(query, connection)).Fill(dt);
            }
            catch (SqlException ex)
            {
                throw new Exception("Database error while loading equipment list: " + ex.Message, ex);
            }
            finally
            {
                connection.Close();
            }
            return dt;
        }

        // Quick connection test — call on application startup.
        // Returns true if the database is reachable, false otherwise.
        public bool TestConnection()
        {
            SqlConnection connection = new SqlConnection(_connectionString);
            try
            {
                connection.Open();
                return true;
            }
            catch
            {
                return false;
            }
            finally
            {
                connection.Close();
            }
        }
    }
}
