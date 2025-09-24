// scripts/test-headless-migration.mjs
import fetch from 'node-fetch'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const config = {
  baseUrl: process.env.CIRCLE_HEADLESS_BASE_URL || 'https://app.circle.so',
  apiToken: process.env.CIRCLE_API_TOKEN,
  email: process.env.CIRCLE_HEADLESS_EMAIL,
  communityId: process.env.CIRCLE_COMMUNITY_ID
}

console.log('🔧 Testing Circle Headless API Migration')
console.log('=' .repeat(50))

// Test 1: Authentication
async function testAuthentication() {
  console.log('📡 Testing authentication...')
  
  try {
    const response = await fetch(`${config.baseUrl}/api/v1/headless/auth_token`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: config.email,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.log('❌ Authentication failed:', errorData)
      return null
    }

    const authData = await response.json()
    console.log('✅ Authentication successful')
    console.log(`   Community ID: ${authData.community_id}`)
    console.log(`   Member ID: ${authData.community_member_id}`)
    console.log(`   Token expires: ${authData.access_token_expires_at}`)
    
    return authData
  } catch (error) {
    console.log('❌ Authentication error:', error.message)
    return null
  }
}

// Test 2: Member Profile
async function testMemberProfile(authData) {
  console.log('\n👤 Testing member profile...')
  
  try {
    const response = await fetch(`${config.baseUrl}/api/headless/v1/community_member`, {
      headers: {
        'Authorization': `Bearer ${authData.access_token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.log('❌ Profile fetch failed:', errorData)
      return
    }

    const profile = await response.json()
    console.log('✅ Profile fetch successful')
    console.log(`   Name: ${profile.name}`)
    console.log(`   Email: ${profile.email}`)
    console.log(`   Admin: ${profile.roles.admin}`)
    console.log(`   Spaces: ${profile.spaces_count}`)
    
    // Check for broker ID
    const brokerField = profile.profile_fields.not_visible.find(
      field => field.key === 'ti_bi_globe_client_id'
    )
    if (brokerField) {
      console.log(`   Broker ID: ${brokerField.community_member_profile_field.display_value}`)
    }
    
    return profile
  } catch (error) {
    console.log('❌ Profile fetch error:', error.message)
  }
}

// Test 3: Members List
async function testMembersList(authData) {
  console.log('\n👥 Testing members list...')
  
  try {
    const response = await fetch(`${config.baseUrl}/api/headless/v1/community_members?per_page=5`, {
      headers: {
        'Authorization': `Bearer ${authData.access_token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.log('❌ Members list failed:', errorData)
      return
    }

    const membersData = await response.json()
    console.log('✅ Members list successful')
    console.log(`   Total members: ${membersData.count}`)
    console.log(`   Current page: ${membersData.page}`)
    console.log(`   Per page: ${membersData.per_page}`)
    console.log(`   Page count: ${membersData.page_count}`)
    
    console.log('\n   Sample members:')
    membersData.records.slice(0, 3).forEach((member, i) => {
      console.log(`   ${i + 1}. ${member.name} (${member.email})`)
      console.log(`      Admin: ${member.roles.admin}, Moderator: ${member.roles.moderator}`)
    })
    
    return membersData
  } catch (error) {
    console.log('❌ Members list error:', error.message)
  }
}

// Test 4: API Endpoints
async function testAPIEndpoints() {
  console.log('\n🔗 Testing local API endpoints...')
  
  const endpoints = [
    'http://localhost:3000/api/circle/members?per_page=5',
    'http://localhost:3000/api/circle/profile',
  ]
  
  for (const endpoint of endpoints) {
    try {
      console.log(`   Testing: ${endpoint}`)
      const response = await fetch(endpoint)
      
      if (response.ok) {
        const data = await response.json()
        console.log(`   ✅ ${endpoint} - Success`)
        if (data.data) console.log(`      Records: ${data.data.length}`)
        if (data.meta) console.log(`      Meta: ${JSON.stringify(data.meta)}`)
      } else {
        console.log(`   ❌ ${endpoint} - Failed: ${response.status}`)
      }
    } catch (error) {
      console.log(`   ❌ ${endpoint} - Error: ${error.message}`)
    }
  }
}

// Main execution
async function main() {
  // Check environment variables
  const required = ['CIRCLE_API_TOKEN', 'CIRCLE_HEADLESS_EMAIL', 'CIRCLE_COMMUNITY_ID']
  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    console.log('❌ Missing environment variables:', missing)
    console.log('Make sure your .env.local file contains all required variables')
    return
  }
  
  const authData = await testAuthentication()
  if (!authData) return
  
  await testMemberProfile(authData)
  await testMembersList(authData)
  
  console.log('\n🌐 Testing local API endpoints (make sure your dev server is running)...')
  await testAPIEndpoints()
  
  console.log('\n' + '='.repeat(50))
  console.log('🎉 Migration test completed!')
  console.log('If all tests passed, you can proceed with the migration.')
}

main().catch(console.error)