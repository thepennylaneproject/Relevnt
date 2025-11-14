// =====================================================
// ðŸ’¼ JOBS API ENDPOINT
// =====================================================
// 
// Endpoint: /.netlify/functions/jobs
// Methods: GET (search/list/get)
// Auth: Required (JWT token)
// 
// This function handles:
// - GET /jobs - List all jobs (with pagination)
// - GET /jobs?id=uuid - Get specific job
// - GET /jobs?search=keyword - Search jobs
// - GET /jobs?remote=true - Filter by remote
// 
// ðŸŽ“ LEARNING NOTE:
// Jobs are read-only for regular users
// Admin functions (create/update/delete) would use service_role
// 
// =====================================================

const { supabase, verifyToken, createResponse, handleCORS, withErrorHandler } = require('./utils/supabase');

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

  // Only support GET for jobs
  if (event.httpMethod !== 'GET') {
    return createResponse(405, {
      success: false,
      error: 'Only GET method supported for jobs'
    });
  }

  // Parse query parameters
  const params = event.queryStringParameters || {};
  const {
    id,             // Get specific job
    search,         // Search keyword
    location,       // Filter by location
    remote,         // Filter by remote (true/false)
    company,        // Filter by company
    employment_type, // Filter by employment type
    experience_level, // Filter by experience level
    page = 1,       // Pagination: page number
    limit = 20      // Pagination: items per page
  } = params;

  // ðŸŽ“ Query Parameters for Filtering:
  // Instead of multiple endpoints (/jobs/remote, /jobs/onsite)
  // Use one endpoint with query params: /jobs?remote=true
  // More flexible and RESTful

  // Route based on presence of ID
  if (id) {
    return await handleGetJob(id, userId);
  }

  if (search) {
    return await handleSearchJobs(search, params, userId);
  }

  return await handleListJobs(params, userId);
});

// =====================================================
// GET SPECIFIC JOB
// =====================================================

/**
 * Get job details by ID
 * 
 * Example request:
 * GET /.netlify/functions/jobs?id=uuid
 * Authorization: Bearer <jwt-token>
 * 
 * Example response:
 * {
 *   success: true,
 *   data: {
 *     id: "uuid",
 *     title: "Senior Frontend Developer",
 *     company: "TechCorp",
 *     description: "...",
 *     requirements: [...],
 *     isApplied: false  // Has user applied?
 *   }
 * }
 */
async function handleGetJob(jobId, userId) {
  // Get job details
  const { data: job, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return createResponse(404, {
        success: false,
        error: 'Job not found'
      });
    }
    
    console.error('Get job error:', error);
    return createResponse(500, {
      success: false,
      error: 'Failed to fetch job'
    });
  }

  // Check if user has already applied to this job
  const { data: application } = await supabase
    .from('applications')
    .select('id, status')
    .eq('job_id', jobId)
    .eq('user_id', userId)
    .single();

  // ðŸŽ“ User Experience Enhancement:
  // Including isApplied and applicationStatus helps frontend
  // Show "Applied" button or "View Application" instead of "Apply"
  // Better UX without extra frontend queries

  return createResponse(200, {
    success: true,
    data: {
      ...job,
      isApplied: !!application,
      applicationStatus: application?.status || null
    }
  });
}

// =====================================================
// SEARCH JOBS (FULL-TEXT SEARCH)
// =====================================================

/**
 * Search jobs using full-text search
 * 
 * Example request:
 * GET /.netlify/functions/jobs?search=react+developer&remote=true&limit=10
 * Authorization: Bearer <jwt-token>
 * 
 * Example response:
 * {
 *   success: true,
 *   data: [...jobs],
 *   pagination: {
 *     total: 45,
 *     page: 1,
 *     limit: 10,
 *     totalPages: 5
 *   }
 * }
 */
async function handleSearchJobs(searchQuery, params, userId) {
  const { location, remote, company, employment_type, experience_level, page = 1, limit = 20 } = params;
  
  // Convert page/limit to offset for database query
  const offset = (page - 1) * limit;

  // ðŸŽ“ Pagination Math:
  // Page 1: offset = 0, limit = 20 â†’ rows 0-19
  // Page 2: offset = 20, limit = 20 â†’ rows 20-39
  // Page 3: offset = 40, limit = 20 â†’ rows 40-59
  // Formula: offset = (page - 1) * limit

  // Build search query
  let query = supabase
    .from('jobs')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
    .textSearch('fts', searchQuery, {
      type: 'websearch',
      config: 'english'
    });

  // ðŸŽ“ Full-Text Search in Supabase:
  // .textSearch() uses PostgreSQL full-text search
  // Much faster than LIKE '%keyword%'
  // Handles stemming (search "running" finds "run")
  // Ranks results by relevance

  // Apply filters
  if (location) {
    query = query.ilike('location', `%${location}%`);
  }

  // ðŸŽ“ ilike vs like:
  // like - Case-sensitive: 'New York' matches, 'new york' doesn't
  // ilike - Case-insensitive: both match
  // % is wildcard: %york% matches "New York", "york", "yorkshire"

  if (remote === 'true') {
    query = query.eq('remote_type', 'remote');
  } else if (remote === 'false') {
    query = query.in('remote_type', ['on-site', 'hybrid']);
  }

  if (company) {
    query = query.ilike('company', `%${company}%`);
  }

  if (employment_type) {
    query = query.eq('employment_type', employment_type);
  }

  if (experience_level) {
    query = query.eq('experience_level', experience_level);
  }

  // Apply pagination and sorting
  query = query
    .order('posted_date', { ascending: false })
    .range(offset, offset + limit - 1);

  // ðŸŽ“ .range(start, end):
  // Returns rows from start to end (inclusive)
  // Example: .range(0, 19) returns 20 rows (0-19)
  // More efficient than LIMIT/OFFSET for pagination

  const { data, error, count } = await query;

  if (error) {
    console.error('Search jobs error:', error);
    return createResponse(500, {
      success: false,
      error: 'Failed to search jobs'
    });
  }

  return createResponse(200, {
    success: true,
    data,
    pagination: {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit)
    }
  });

  // ðŸŽ“ Why return pagination metadata?
  // Frontend needs to know:
  // - How many total results?
  // - Current page?
  // - How many pages total?
  // - Should show "Next" button?
}

// =====================================================
// LIST JOBS (WITH FILTERS)
// =====================================================

/**
 * List jobs with optional filters
 * 
 * Example request:
 * GET /.netlify/functions/jobs?remote=true&employment_type=full-time&page=2&limit=10
 * Authorization: Bearer <jwt-token>
 */
async function handleListJobs(params, userId) {
  const { 
    location, 
    remote, 
    company, 
    employment_type, 
    experience_level,
    salary_min,
    salary_max,
    page = 1, 
    limit = 20 
  } = params;
  
  const offset = (page - 1) * limit;

  // Build query
  let query = supabase
    .from('jobs')
    .select('*', { count: 'exact' })
    .eq('is_active', true);

  // Apply filters (same as search, but without text search)
  if (location) {
    query = query.ilike('location', `%${location}%`);
  }

  if (remote === 'true') {
    query = query.eq('remote_type', 'remote');
  } else if (remote === 'false') {
    query = query.in('remote_type', ['on-site', 'hybrid']);
  }

  if (company) {
    query = query.ilike('company', `%${company}%`);
  }

  if (employment_type) {
    query = query.eq('employment_type', employment_type);
  }

  if (experience_level) {
    query = query.eq('experience_level', experience_level);
  }

  // Salary filters
  if (salary_min) {
    query = query.gte('salary_max', parseInt(salary_min));
  }

  // ðŸŽ“ .gte() = "Greater Than or Equal"
  // Other operators:
  // .eq() - Equal
  // .neq() - Not equal
  // .gt() - Greater than
  // .gte() - Greater than or equal
  // .lt() - Less than
  // .lte() - Less than or equal

  if (salary_max) {
    query = query.lte('salary_min', parseInt(salary_max));
  }

  // Sort and paginate
  query = query
    .order('posted_date', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('List jobs error:', error);
    return createResponse(500, {
      success: false,
      error: 'Failed to fetch jobs'
    });
  }

  return createResponse(200, {
    success: true,
    data,
    pagination: {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit),
      hasMore: offset + limit < count
    }
  });

  // ðŸŽ“ hasMore flag:
  // Quick check for infinite scroll: hasMore ? loadMore() : null
  // Avoids loading empty pages
}

// =====================================================
// FUNCTION COMPLETE! âœ…
// =====================================================
// 
// ðŸŽ“ What we built:
// âœ… Get specific job details (with application status)
// âœ… Full-text search across jobs
// âœ… Advanced filtering (location, remote, salary, etc.)
// âœ… Pagination for large result sets
// âœ… Sorted by date (newest first)
// 
// Advanced features we could add:
// - Save/bookmark jobs
// - Job recommendations based on profile
// - Similar jobs suggestions
// - Job alerts (notify on new matches)
// 
// =====================================================
