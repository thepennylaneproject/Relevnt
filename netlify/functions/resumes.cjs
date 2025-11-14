// =====================================================
// ðŸ“„ RESUMES API ENDPOINT
// =====================================================
// 
// Endpoint: /.netlify/functions/resumes
// Methods: GET, POST, PUT, DELETE
// Auth: Required (JWT token)
// 
// This function handles:
// - GET: List all user's resumes or get specific resume
// - POST: Create new resume
// - PUT: Update existing resume
// - DELETE: Delete resume
// 
// ðŸŽ“ CRUD Operations:
// Create (POST), Read (GET), Update (PUT), Delete (DELETE)
// These 4 operations cover all basic data manipulation
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

  // Get resumeId from query string if provided
  // Example: /.netlify/functions/resumes?id=uuid
  const params = event.queryStringParameters || {};
  const resumeId = params.id;

  // ðŸŽ“ Query String Parameters:
  // URL after ? contains key=value pairs
  // Example: /resumes?id=123&format=json
  // Accessed via event.queryStringParameters

  // Route based on HTTP method
  switch (event.httpMethod) {
    case 'GET':
      return resumeId 
        ? await handleGetResume(userId, resumeId)
        : await handleListResumes(userId);
    
    case 'POST':
      return await handleCreateResume(userId, event.body);
    
    case 'PUT':
      if (!resumeId) {
        return createResponse(400, {
          success: false,
          error: 'Resume ID required for update'
        });
      }
      return await handleUpdateResume(userId, resumeId, event.body);
    
    case 'DELETE':
      if (!resumeId) {
        return createResponse(400, {
          success: false,
          error: 'Resume ID required for delete'
        });
      }
      return await handleDeleteResume(userId, resumeId);
    
    default:
      return createResponse(405, {
        success: false,
        error: 'Method not allowed'
      });
  }
});

// =====================================================
// GET ALL RESUMES (LIST)
// =====================================================

/**
 * Get all resumes for authenticated user
 * 
 * Example request:
 * GET /.netlify/functions/resumes
 * Authorization: Bearer <jwt-token>
 * 
 * Example response:
 * {
 *   success: true,
 *   data: [
 *     { id: "uuid1", title: "Software Engineer Resume", ... },
 *     { id: "uuid2", title: "Frontend Developer Resume", ... }
 *   ],
 *   count: 2
 * }
 */
async function handleListResumes(userId) {
  const { data, error, count } = await supabase
    .from('resumes')
    .select('*', { count: 'exact' }) // Get count of total resumes
    .eq('user_id', userId)
    .order('updated_at', { ascending: false }); // Newest first

  // ðŸŽ“ Order By:
  // .order('column', { ascending: false }) - Sort results
  // ascending: false = descending (newest/highest first)
  // Common sorting: created_at, updated_at, title, etc.

  if (error) {
    console.error('List resumes error:', error);
    return createResponse(500, {
      success: false,
      error: 'Failed to fetch resumes'
    });
  }

  return createResponse(200, {
    success: true,
    data,
    count
  });
}

// =====================================================
// GET SINGLE RESUME
// =====================================================

/**
 * Get specific resume by ID
 * 
 * Example request:
 * GET /.netlify/functions/resumes?id=uuid
 * Authorization: Bearer <jwt-token>
 * 
 * Example response:
 * {
 *   success: true,
 *   data: {
 *     id: "uuid",
 *     title: "Software Engineer Resume",
 *     professional_summary: "...",
 *     experiences: [...],
 *     education: [...],
 *     skills: [...]
 *   }
 * }
 */
async function handleGetResume(userId, resumeId) {
  // Get resume with related data (experiences, education, skills)
  const { data, error } = await supabase
    .from('resumes')
    .select(`
      *,
      experiences (*),
      education (*),
      skills (*)
    `)
    .eq('id', resumeId)
    .eq('user_id', userId)
    .single();

  // ðŸŽ“ JOIN Queries in Supabase:
  // .select('*, experiences (*), education (*), skills (*)')
  // This is like SQL JOIN - gets related data in one query
  // More efficient than separate queries for each table

  if (error) {
    if (error.code === 'PGRST116') {
      return createResponse(404, {
        success: false,
        error: 'Resume not found'
      });
    }
    
    console.error('Get resume error:', error);
    return createResponse(500, {
      success: false,
      error: 'Failed to fetch resume'
    });
  }

  return createResponse(200, {
    success: true,
    data
  });
}

// =====================================================
// CREATE RESUME
// =====================================================

/**
 * Create new resume
 * 
 * Example request:
 * POST /.netlify/functions/resumes
 * Authorization: Bearer <jwt-token>
 * Content-Type: application/json
 * 
 * {
 *   "title": "Senior Developer Resume",
 *   "full_name": "John Doe",
 *   "email": "john@example.com",
 *   "phone": "555-1234",
 *   "professional_summary": "Experienced developer...",
 *   "is_default": false
 * }
 */
async function handleCreateResume(userId, bodyString) {
  // Parse request body
  let resumeData;
  try {
    resumeData = JSON.parse(bodyString);
  } catch (error) {
    return createResponse(400, {
      success: false,
      error: 'Invalid JSON'
    });
  }

  // Validate required fields
  const validationError = validateFields(resumeData, ['title', 'full_name', 'email']);
  if (validationError) {
    return createResponse(400, {
      success: false,
      error: validationError
    });
  }

  // If this is set as default, unset other default resumes
  if (resumeData.is_default) {
    await supabase
      .from('resumes')
      .update({ is_default: false })
      .eq('user_id', userId)
      .eq('is_default', true);

    // ðŸŽ“ Why update before insert?
    // Ensure only ONE resume is default
    // This prevents conflicts (multiple defaults)
    // Good practice for "one-of-many" flags
  }

  // Create resume
  const { data, error } = await supabase
    .from('resumes')
    .insert({
      ...resumeData,
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  // ðŸŽ“ Spread Operator (...):
  // ...resumeData spreads all properties from resumeData
  // Then we add/override specific fields (user_id, timestamps)
  // Cleaner than manually copying each field

  if (error) {
    console.error('Create resume error:', error);
    return createResponse(500, {
      success: false,
      error: 'Failed to create resume'
    });
  }

  return createResponse(201, {
    success: true,
    data,
    message: 'Resume created successfully'
  });

  // ðŸŽ“ 201 Created:
  // HTTP status code for successful resource creation
  // Different from 200 OK (general success)
  // Indicates something NEW was created
}

// =====================================================
// UPDATE RESUME
// =====================================================

/**
 * Update existing resume
 * 
 * Example request:
 * PUT /.netlify/functions/resumes?id=uuid
 * Authorization: Bearer <jwt-token>
 * Content-Type: application/json
 * 
 * {
 *   "title": "Updated Title",
 *   "professional_summary": "Updated summary..."
 * }
 */
async function handleUpdateResume(userId, resumeId, bodyString) {
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

  // Verify resume belongs to user
  const { data: existing, error: fetchError } = await supabase
    .from('resumes')
    .select('id')
    .eq('id', resumeId)
    .eq('user_id', userId)
    .single();

  // ðŸŽ“ Ownership Check:
  // Always verify user owns the resource before updating
  // Prevents users from modifying others' data
  // Even with RLS, good to double-check in API

  if (fetchError || !existing) {
    return createResponse(404, {
      success: false,
      error: 'Resume not found or access denied'
    });
  }

  // If setting as default, unset other defaults
  if (updates.is_default) {
    await supabase
      .from('resumes')
      .update({ is_default: false })
      .eq('user_id', userId)
      .eq('is_default', true)
      .neq('id', resumeId); // Don't update the current resume yet

    // ðŸŽ“ .neq() = "not equal"
    // SQL equivalent: WHERE id != resumeId
    // Exclude current resume from the update
  }

  // Update resume
  updates.updated_at = new Date().toISOString();
  updates.last_modified_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('resumes')
    .update(updates)
    .eq('id', resumeId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Update resume error:', error);
    return createResponse(500, {
      success: false,
      error: 'Failed to update resume'
    });
  }

  return createResponse(200, {
    success: true,
    data,
    message: 'Resume updated successfully'
  });
}

// =====================================================
// DELETE RESUME
// =====================================================

/**
 * Delete resume
 * 
 * Example request:
 * DELETE /.netlify/functions/resumes?id=uuid
 * Authorization: Bearer <jwt-token>
 * 
 * Example response:
 * {
 *   success: true,
 *   message: "Resume deleted successfully"
 * }
 */
async function handleDeleteResume(userId, resumeId) {
  // Verify resume exists and belongs to user
  const { data: existing, error: fetchError } = await supabase
    .from('resumes')
    .select('id')
    .eq('id', resumeId)
    .eq('user_id', userId)
    .single();

  if (fetchError || !existing) {
    return createResponse(404, {
      success: false,
      error: 'Resume not found or access denied'
    });
  }

  // Delete resume (will cascade delete related experiences, education, skills)
  const { error } = await supabase
    .from('resumes')
    .delete()
    .eq('id', resumeId)
    .eq('user_id', userId);

  // ðŸŽ“ CASCADE DELETE:
  // When resume is deleted, all related data is automatically deleted
  // This was set up in database schema with ON DELETE CASCADE
  // Prevents "orphaned" data (experiences without a resume)

  if (error) {
    console.error('Delete resume error:', error);
    return createResponse(500, {
      success: false,
      error: 'Failed to delete resume'
    });
  }

  return createResponse(200, {
    success: true,
    message: 'Resume deleted successfully'
  });
}

// =====================================================
// FUNCTION COMPLETE! âœ…
// =====================================================
// 
// ðŸŽ“ What we built:
// âœ… List all resumes for a user
// âœ… Get specific resume with all related data
// âœ… Create new resume
// âœ… Update resume (with default flag handling)
// âœ… Delete resume (with cascade)
// âœ… Proper authentication & ownership checks
// âœ… Error handling & validation
// 
// This is a complete REST API for resume management!
// 
// =====================================================
