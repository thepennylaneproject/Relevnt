// =====================================================
// ðŸ“ APPLICATIONS API ENDPOINT
// =====================================================
// 
// Endpoint: /.netlify/functions/applications
// Methods: GET, POST, PUT, DELETE
// Auth: Required (JWT token)
// 
// This function handles:
// - GET: List all user's applications or get specific application
// - POST: Create new application (apply to job)
// - PUT: Update application (status, notes, etc.)
// - DELETE: Delete/withdraw application
// 
// ðŸŽ“ APPLICATION WORKFLOW:
// saved â†’ applied â†’ screening â†’ interviewing â†’ offer â†’ accepted
// At any point: â†’ rejected or â†’ withdrawn
// 
// =====================================================

const { supabase, verifyToken, createResponse, handleCORS, validateFields, withErrorHandler } = require('./utils/supabase');

exports.handler = withErrorHandler(async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return handleCORS();
  }

  // Verify authentication
  const { userId, error: authError } = await verifyToken(event.headers.authorization);
  
  if (authError) {
    return createResponse(401, {
      success: false,
      error: 'Unauthorized',
      message: authError
    });
  }

  // Parse query parameters
  const params = event.queryStringParameters || {};
  const applicationId = params.id;
  const status = params.status; // Filter by status

  // Route based on HTTP method
  switch (event.httpMethod) {
    case 'GET':
      return applicationId
        ? await handleGetApplication(userId, applicationId)
        : await handleListApplications(userId, params);
    
    case 'POST':
      return await handleCreateApplication(userId, event.body);
    
    case 'PUT':
      if (!applicationId) {
        return createResponse(400, {
          success: false,
          error: 'Application ID required for update'
        });
      }
      return await handleUpdateApplication(userId, applicationId, event.body);
    
    case 'DELETE':
      if (!applicationId) {
        return createResponse(400, {
          success: false,
          error: 'Application ID required for delete'
        });
      }
      return await handleDeleteApplication(userId, applicationId);
    
    default:
      return createResponse(405, {
        success: false,
        error: 'Method not allowed'
      });
  }
});

// =====================================================
// GET ALL APPLICATIONS (LIST)
// =====================================================

/**
 * Get all applications for authenticated user
 * Optionally filter by status
 * 
 * Example request:
 * GET /.netlify/functions/applications?status=applied
 * Authorization: Bearer <jwt-token>
 * 
 * Example response:
 * {
 *   success: true,
 *   data: [...applications],
 *   stats: {
 *     total: 25,
 *     saved: 5,
 *     applied: 10,
 *     interviewing: 3,
 *     offered: 1,
 *     rejected: 6
 *   }
 * }
 */
async function handleListApplications(userId, params) {
  const { status, page = 1, limit = 50 } = params;
  const offset = (page - 1) * limit;

  // Build query with job details
  let query = supabase
    .from('applications')
    .select(`
      *,
      jobs (
        id,
        title,
        company,
        location,
        remote_type,
        employment_type,
        company_logo_url
      ),
      resumes (
        id,
        title
      )
    `, { count: 'exact' })
    .eq('user_id', userId);

  // ðŸŽ“ JOIN with jobs and resumes:
  // Gets application data + related job info in one query
  // Much more efficient than:
  // 1. Get applications
  // 2. For each app, get job
  // 3. For each app, get resume

  // Filter by status if provided
  if (status) {
    query = query.eq('status', status);
  }

  // Sort by updated_at (most recently updated first)
  query = query
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('List applications error:', error);
    return createResponse(500, {
      success: false,
      error: 'Failed to fetch applications'
    });
  }

  // Get statistics (count by status)
  const { data: statsData } = await supabase
    .from('applications')
    .select('status')
    .eq('user_id', userId);

  // ðŸŽ“ Why separate query for stats?
  // Could use PostgreSQL aggregate functions
  // But simpler to count in JavaScript for small datasets
  // For large datasets, use SQL: COUNT(*) GROUP BY status

  const stats = {
    total: statsData?.length || 0,
    saved: statsData?.filter(a => a.status === 'saved').length || 0,
    applied: statsData?.filter(a => a.status === 'applied').length || 0,
    screening: statsData?.filter(a => a.status === 'screening').length || 0,
    interviewing: statsData?.filter(a => a.status === 'interviewing').length || 0,
    offer: statsData?.filter(a => a.status === 'offer').length || 0,
    accepted: statsData?.filter(a => a.status === 'accepted').length || 0,
    rejected: statsData?.filter(a => a.status === 'rejected').length || 0,
    withdrawn: statsData?.filter(a => a.status === 'withdrawn').length || 0
  };

  return createResponse(200, {
    success: true,
    data,
    count,
    stats
  });
}

// =====================================================
// GET SINGLE APPLICATION
// =====================================================

/**
 * Get specific application with full details
 * 
 * Example request:
 * GET /.netlify/functions/applications?id=uuid
 * Authorization: Bearer <jwt-token>
 */
async function handleGetApplication(userId, applicationId) {
  const { data, error } = await supabase
    .from('applications')
    .select(`
      *,
      jobs (*),
      resumes (*)
    `)
    .eq('id', applicationId)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return createResponse(404, {
        success: false,
        error: 'Application not found'
      });
    }
    
    console.error('Get application error:', error);
    return createResponse(500, {
      success: false,
      error: 'Failed to fetch application'
    });
  }

  return createResponse(200, {
    success: true,
    data
  });
}

// =====================================================
// CREATE APPLICATION
// =====================================================

/**
 * Create new application (apply to job or save for later)
 * 
 * Example request:
 * POST /.netlify/functions/applications
 * Authorization: Bearer <jwt-token>
 * Content-Type: application/json
 * 
 * {
 *   "job_id": "uuid",
 *   "resume_id": "uuid",
 *   "status": "applied",
 *   "cover_letter": "Dear Hiring Manager...",
 *   "notes": "Found on LinkedIn"
 * }
 */
async function handleCreateApplication(userId, bodyString) {
  // Parse request body
  let applicationData;
  try {
    applicationData = JSON.parse(bodyString);
  } catch (error) {
    return createResponse(400, {
      success: false,
      error: 'Invalid JSON'
    });
  }

  // Validate required fields
  const validationError = validateFields(applicationData, ['job_id']);
  if (validationError) {
    return createResponse(400, {
      success: false,
      error: validationError
    });
  }

  // Check if already applied to this job
  const { data: existing } = await supabase
    .from('applications')
    .select('id, status')
    .eq('user_id', userId)
    .eq('job_id', applicationData.job_id)
    .single();

  // ðŸŽ“ Prevent duplicate applications:
  // Users shouldn't apply to same job twice
  // Better UX to update existing application
  // Keeps data clean (one app per job)

  if (existing) {
    return createResponse(400, {
      success: false,
      error: 'Already applied to this job',
      existingApplication: existing
    });
  }

  // Set applied_date if status is 'applied'
  if (applicationData.status === 'applied' && !applicationData.applied_date) {
    applicationData.applied_date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  }

  // ðŸŽ“ Date formatting:
  // new Date().toISOString() â†’ "2025-01-15T10:30:00.000Z"
  // .split('T')[0] â†’ "2025-01-15"
  // Database DATE type requires YYYY-MM-DD format

  // Create application
  const { data, error } = await supabase
    .from('applications')
    .insert({
      ...applicationData,
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select(`
      *,
      jobs (
        id,
        title,
        company
      )
    `)
    .single();

  if (error) {
    console.error('Create application error:', error);
    return createResponse(500, {
      success: false,
      error: 'Failed to create application'
    });
  }

  // Log activity
  await supabase
    .from('activity_log')
    .insert({
      user_id: userId,
      action: applicationData.status === 'saved' ? 'saved_job' : 'applied_to_job',
      entity_type: 'application',
      entity_id: data.id,
      metadata: {
        job_id: applicationData.job_id,
        job_title: data.jobs?.title,
        company: data.jobs?.company
      }
    });

  // ðŸŽ“ Activity Logging:
  // Track important user actions
  // Useful for analytics, debugging, audit trails
  // Don't block API if logging fails (fire and forget)

  return createResponse(201, {
    success: true,
    data,
    message: applicationData.status === 'saved' 
      ? 'Job saved successfully' 
      : 'Application submitted successfully'
  });
}

// =====================================================
// UPDATE APPLICATION
// =====================================================

/**
 * Update application (status, notes, interview dates, etc.)
 * 
 * Example request:
 * PUT /.netlify/functions/applications?id=uuid
 * Authorization: Bearer <jwt-token>
 * Content-Type: application/json
 * 
 * {
 *   "status": "interviewing",
 *   "notes": "Phone screen scheduled for Friday",
 *   "interview_dates": ["2025-01-20T14:00:00Z"]
 * }
 */
async function handleUpdateApplication(userId, applicationId, bodyString) {
  // Parse request body
  let updates;
  try {
    updates = JSON.parse(bodyString);
  } catch (error) {
    return createResponse(400, {
      success: false,
      error: 'Invalid JSON'
    });
  }

  // Verify application belongs to user
  const { data: existing, error: fetchError } = await supabase
    .from('applications')
    .select('*')
    .eq('id', applicationId)
    .eq('user_id', userId)
    .single();

  if (fetchError || !existing) {
    return createResponse(404, {
      success: false,
      error: 'Application not found or access denied'
    });
  }

  // Validate status transitions
  const validStatuses = ['saved', 'applied', 'screening', 'interviewing', 'offer', 'accepted', 'rejected', 'withdrawn'];
  if (updates.status && !validStatuses.includes(updates.status)) {
    return createResponse(400, {
      success: false,
      error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
    });
  }

  // ðŸŽ“ Status Validation:
  // Prevent typos: "interviewing" vs "interview"
  // Ensures data consistency
  // Makes filtering/reporting reliable

  // Set applied_date when status changes to 'applied'
  if (updates.status === 'applied' && existing.status !== 'applied' && !updates.applied_date) {
    updates.applied_date = new Date().toISOString().split('T')[0];
  }

  // Update timestamp
  updates.updated_at = new Date().toISOString();

  // Update application
  const { data, error } = await supabase
    .from('applications')
    .update(updates)
    .eq('id', applicationId)
    .eq('user_id', userId)
    .select(`
      *,
      jobs (
        id,
        title,
        company
      )
    `)
    .single();

  if (error) {
    console.error('Update application error:', error);
    return createResponse(500, {
      success: false,
      error: 'Failed to update application'
    });
  }

  // Log status change
  if (updates.status && updates.status !== existing.status) {
    await supabase
      .from('activity_log')
      .insert({
        user_id: userId,
        action: 'updated_application_status',
        entity_type: 'application',
        entity_id: applicationId,
        metadata: {
          old_status: existing.status,
          new_status: updates.status,
          job_title: data.jobs?.title,
          company: data.jobs?.company
        }
      });
  }

  return createResponse(200, {
    success: true,
    data,
    message: 'Application updated successfully'
  });
}

// =====================================================
// DELETE APPLICATION
// =====================================================

/**
 * Delete application (withdraw application)
 * 
 * Example request:
 * DELETE /.netlify/functions/applications?id=uuid
 * Authorization: Bearer <jwt-token>
 */
async function handleDeleteApplication(userId, applicationId) {
  // Verify application exists and belongs to user
  const { data: existing, error: fetchError } = await supabase
    .from('applications')
    .select('id')
    .eq('id', applicationId)
    .eq('user_id', userId)
    .single();

  if (fetchError || !existing) {
    return createResponse(404, {
      success: false,
      error: 'Application not found or access denied'
    });
  }

  // Delete application
  const { error } = await supabase
    .from('applications')
    .delete()
    .eq('id', applicationId)
    .eq('user_id', userId);

  if (error) {
    console.error('Delete application error:', error);
    return createResponse(500, {
      success: false,
      error: 'Failed to delete application'
    });
  }

  return createResponse(200, {
    success: true,
    message: 'Application deleted successfully'
  });

  // ðŸŽ“ Delete vs Withdraw:
  // Could add 'withdrawn' status instead of deleting
  // Keeps history of all applications
  // User can see "I withdrew from 5 jobs"
  // Delete = permanent removal (no history)
}

// =====================================================
// FUNCTION COMPLETE! âœ…
// =====================================================
// 
// ðŸŽ“ What we built:
// âœ… List applications with job details
// âœ… Get specific application
// âœ… Create application (apply or save)
// âœ… Update application (status tracking)
// âœ… Delete application
// âœ… Application statistics by status
// âœ… Activity logging for important events
// âœ… Duplicate application prevention
// âœ… Status transition validation
// 
// This is the core of job application tracking!
// 
// Additional features we could add:
// - Interview prep checklists
// - Document attachments
// - Email notifications on status change
// - Reminder for next steps
// - Application timeline view
// 
// =====================================================
