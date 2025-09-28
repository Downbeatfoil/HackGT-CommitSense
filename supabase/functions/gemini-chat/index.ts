import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Request received, parsing JSON...');
    const { prompt } = await req.json()
    console.log('Prompt received:', prompt ? 'Yes' : 'No');
    
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    console.log('API key available:', geminiApiKey ? 'Yes' : 'No');
    
    if (!geminiApiKey) {
      console.error('Missing GEMINI_API_KEY environment variable');
      throw new Error('Gemini API key not configured')
    }

    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    }

    console.log('Making request to Gemini API...');
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    console.log('Gemini API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('Gemini API response received');
    
    if (!data.candidates || !data.candidates[0]?.content?.parts[0]?.text) {
      console.error('Invalid Gemini response structure:', JSON.stringify(data));
      throw new Error('Invalid response from Gemini API')
    }

    const result = data.candidates[0].content.parts[0].text
    console.log('Successfully processed request');

    return new Response(
      JSON.stringify({ result }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Edge function error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', errorMessage);
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})