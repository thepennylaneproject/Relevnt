// =====================================================
// ðŸ‘¤ USER PROFILE API ENDPOINT
// =====================================================
// 
// Endpoint: /.netlify/functions/user-profile
// Methods: GET, PUT
// Auth: Required (JWT token)
// 
// This function handles:
// - GET: Fetch user's profile data
// - PUT: Update user's profile data
// 
// ðŸŽ“ LEARNING NOTE:
// This is a serverless function - it only runs when called
// No server sitting idle waiting for requests (cost-effective!)
// 
// =====================================================

const { supabase, verifyToken, createResponse, handleCORS, validateFields, withErrorHandler } = require('./utils/supabase');

/**
 * Main handler function
 * Netlify calls this when endpoint is hit
 */
exports.handler = withErrorHandler(async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return handleCORS();
  }

  // ðŸŽ“ What's httpMethod?
  // GET = Read data
  // POST = Create data
  // PUT = Update data
  // DELETE = Delete data
  // OPTIONS = CORS preflight check

  // Verify user authentication
  const { userId, error: authError } = await verifyToken(event.headers.authorization);
  
  if (authError) {
    return createResponse(401, {
      success: false,
      error: 'Unauthorized',
      message: authError
    });
  }

  // ðŸŽ“ 401 Unauthorized:
  // HTTP status code meaning "you need to log in"
  // Different from 403 Forbidden (logged in but no permission)

  // Route to appropriate handler based on HTTP method
  switch (event.httpMethod) {
    case 'GET':
      return await handleGetProfile(userId);
    
    case 'PUT':
      return await handleUpdateProfile(userId, event.body);
    
    default:
      return createResponse(405, {
        success: false,
        error: 'Method not allowed',
        allowedMethods: ['GET', 'PUT']
      });
  }

  // ðŸŽ“ 405 Method Not Allowed:
  // HTTP status code meaning "this endpoint doesn't support that method"
  // Example: POST to an endpoint that only accepts GET
});

// =====================================================
// GET PROFILE
// =====================================================

/**
 * Fetch user's profile data
 * 
 * @param {string} userId - Authenticated user's ID
 * @returns {Promise<Response>} User profile data
 * 
 * Example request:
 * GET /.netlify/functions/user-profile
 * Authorization: Bearer <jwt-token>
 * 
 * Example response:
 * {
 *   success: true,
 *   data: {
 *     id: "uuid",
 *     email: "user@example.com",
 *     full_name: "John Doe",
 *     ...
 *   }
 * }
 */
async function handleGetProfile(userId) {
  // Query database for user profile
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single(); // Returns one row, not an array

  // ðŸŽ“ Supabase Query Breakdown:
  // .from('users') - Which table to query
  // .select('*') - Get all columns (* means all)
  // .eq('id', userId) - WHERE id = userId
  // .single() - Return object, not array (expects 1 result)

  if (error) {
    // If user doesn't exist yet, create profile
    if (error.code === 'PGRST116') {
      // PGRST116 = "No rows found"
      return createResponse(404, {
        success: false,
        error: 'Profile not found',
        message: 'Please complete profile setup'
      });
    }

    console.error('Database error:', error);
    return createResponse(500, {
      success: false,
      error: 'Failed to fetch profile'
    });
  }

  // Remove sensitive fields before sending to client
  const { created_at, updated_at, ...safeData } = data;

  // ðŸŽ“ Destructuring & Rest Operator:
  // const { created_at, updated_at, ...safeData } = data;
  // This extracts created_at and updated_at, puts rest into safeData
  // Useful for excluding sensitive or unnecessary fields

  return createResponse(200, {
    success: true,
    data: safeData
  });
}

// =====================================================
// UPDATE PROFILE
// =====================================================

/**
 * Update user's profile data
 * 
 * @param {string} userId - Authenticated user's ID
 * @param {string} body - JSON string of updated fields
 * @returns {Promise<Response>} Updated profile data
 * 
 * Example request:
 * PUT /.netlify/functions/user-profile
 * Authorization: Bearer <jwt-token>
 * Content-Type: application/json
 * 
 * {
 *   "full_name": "Jane Doe",
 *   "current_title": "Senior Developer",
 *   "location": "San Francisco, CA"
 * }
 * 
 * Example response:
 * {
 *   success: true,
 *   data: { ...updated_profile }
 * }
 */
async function handleUpdateProfile(userId, bodyString) {
  // Parse JSON body
  let updates;
  try {
    updates = JSON.parse(bodyString);
  } catch (error) {
    return createResponse(400, {
      success: false,
      error: 'Invalid JSON in request body'
    });
  }

  // ðŸŽ“ 400 Bad Request:
  // HTTP status code meaning "your request is malformed"
  // Common causes: invalid JSON, missing required fields

  // List of fields that can be updated
  const allowedFields = [
    'full_name',
    'avatar_url',
    'phone',
    'location',
    'current_title',
    'current_company',
    'linkedin_url',
    'github_url',
    'portfolio_url',
    'bio',
    'professional_summary',
    'job_search_status',
    'desired_roles',
    'desired_locations',
    'desired_salary_min',
    'desired_salary_max',
    'desired_remote'
  ];

  // ðŸŽ“ Why filter allowed fields?
  // Security: Prevent users from updating fields they shouldn't
  // Example: User can't set is_admin = true
  // Only allow updates to profile fields

  // Filter updates to only allowed fields
  const filteredUpdates = Object.keys(updates)
    .filter(key => allowedFields.includes(key))
    .reduce((obj, key) => {
      obj[key] = updates[key];
      return obj;
    }, {});

  if (Object.keys(filteredUpdates).length === 0) {
    return createResponse(400, {
      success: false,
      error: 'No valid fields to update'
    });
  }

  // Add updated_at timestamp
  filteredUpdates.updated_at = new Date().toISOString();

  // Update database
  const { data, error } = await supabase
    .from('users')
    .update(filteredUpdates)
    .eq('id', userId)
    .select()
    .single();

  // ðŸŽ“ Query Breakdown:
  // .update(filteredUpdates) - Set these fields
  // .eq('id', userId) - WHERE id = userId
  // .select() - Return the updated row
  // .single() - Return object, not array

  if (error) {
    console.error('Update error:', error);
    return createResponse(500, {
      success: false,
      error: 'Failed to update profile'
    });
  }

  return createResponse(200, {
    success: true,
    data,
    message: 'Profile updated successfully'
  });
}

// =====================================================
// FUNCTION COMPLETE! âœ…
// =====================================================
// 
// ðŸŽ“ Testing This Function:
// 
// 1. Deploy to Netlify
// 2. Get your JWT token from Supabase auth
// 3. Use Postman/Insomnia/curl to test:
// 
// GET request:
// curl -H "Authorization: Bearer YOUR_TOKEN" \
//   https://your-site.netlify.app/.netlify/functions/user-profile
// 
// PUT request:
// curl -X PUT \
//   -H "Authorization: Bearer YOUR_TOKEN" \
//   -H "Content-Type: application/json" \
//   -d '{"full_name": "New Name"}' \
//   https://your-site.netlify.app/.netlify/functions/user-profile
// 
// =====================================================
