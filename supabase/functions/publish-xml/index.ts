
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.9'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  console.log('=== Publish XML function started ===')
  console.log('Request method:', req.method)
  console.log('Request URL:', req.url)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request')
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Environment Check ===')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    console.log('Supabase URL exists:', !!supabaseUrl)
    console.log('Service key exists:', !!supabaseServiceKey)
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables')
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Server configuration error - missing environment variables' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('=== Request Processing ===')
    let requestBody;
    try {
      requestBody = await req.json()
      console.log('Request body parsed successfully')
    } catch (error) {
      console.error('Failed to parse request body:', error)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid JSON in request body' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { items, bucket = 'xml-storage' } = requestBody

    if (!items || !Array.isArray(items)) {
      console.error('Invalid items array:', items)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Items array is required and must be an array' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`=== Publishing ${items.length} XML files to bucket: ${bucket} ===`)

    // Test bucket access first
    try {
      const { data: bucketInfo, error: bucketError } = await supabase.storage
        .from(bucket)
        .list('', { limit: 1 })
      
      if (bucketError) {
        console.error('Bucket access test failed:', bucketError)
        return new Response(
          JSON.stringify({ 
            success: false,
            error: `Cannot access bucket '${bucket}': ${bucketError.message}` 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
      console.log('Bucket access test successful')
    } catch (error) {
      console.error('Bucket access test exception:', error)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `Bucket access failed: ${error.message}` 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const results = []
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const { path, content } = item
      
      console.log(`=== Processing item ${i + 1}/${items.length}: ${path} ===`)
      
      if (!path || !content) {
        console.error(`Invalid item ${i + 1}:`, item)
        results.push({ 
          path: path || `item-${i + 1}`, 
          success: false, 
          error: 'Path and content are required' 
        })
        continue
      }
      
      try {
        console.log(`Uploading ${path} (${content.length} chars)`)
        
        // Convert content to blob for upload
        const blob = new Blob([content], { type: 'application/xml' })
        
        const uploadPath = `published/${path}`
        console.log(`Upload path: ${uploadPath}`)
        
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(uploadPath, blob, {
            upsert: true,
            contentType: 'application/xml'
          })

        if (error) {
          console.error(`Upload error for ${path}:`, error)
          results.push({ 
            path, 
            success: false, 
            error: `Upload failed: ${error.message}` 
          })
        } else {
          console.log(`Upload successful for ${path}:`, data.path)
          results.push({ 
            path, 
            success: true, 
            data: data.path,
            size: content.length 
          })
        }
      } catch (itemError) {
        console.error(`Exception uploading ${path}:`, itemError)
        results.push({ 
          path, 
          success: false, 
          error: `Exception: ${itemError.message}` 
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    console.log(`=== Upload Summary ===`)
    console.log(`Total items: ${items.length}`)
    console.log(`Successful: ${successCount}`)
    console.log(`Failed: ${items.length - successCount}`)
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        publishedCount: successCount,
        totalCount: items.length,
        results,
        bucket,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('=== Function Error ===')
    console.error('Error details:', error)
    console.error('Error stack:', error.stack)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: `Internal server error: ${error.message}`,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
