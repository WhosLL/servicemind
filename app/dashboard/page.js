'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { sb } from '../../lib/supabase'
import '../globals.css'

const NAV = [
  { id: 'overview', label: 'Overview' },
  { id: 'appointments', label: 'Appointments' },
  { id: 'clients', label: 'Clients' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'campaigns', label: 'Automations' },
  { id: 'services', label: 'Services' },
  { id: 'conversations', label: 'Conversations' },
  { id: 'referrals', label: 'Referrals' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'ai', label: 'AI Advisor' },
  { id: 'settings', label: 'Settings' },
]

export default function Dashboard() {
  const router = useRouter()
  const [salon, setSalon] = useState(null)
  useEffect(() => {
    const loadSalon = async () => {
      const { data: { user }, error } = await sb().auth.getUser()
      if (error || !user) { router.push('/login'); return }
      const { data: salons } = await sb().from('salons').select('*').eq('user_id', user.id).limit(1)
      if (!salons || salons.length === 0) { router.push('/login'); return }
      setSalon(salons[0])
    }
    loadSalon()
  }, [])

  const [tab, setTab] = useState('overview')
  const [data, setData] = useState({ services: [], appointments: [], reviews: [], clients: [], campaigns: [], ai_conversations: [], messages: [] })
  const [loading, setLoading] = useState(true)
  const [aiQuery, setAiQuery] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  // === Settings state ===
  const [settingsForm, setSettingsForm] = useState({
    shop_name: '', owner_name: '', phone: '', email: '', city: '', state: '', salon_type: '', passcode: ''
  })
  const [settingsSaving, setSettingsSaving] = useState(false)

  // === SMS state ===
  const [provisioning, setProvisioning] = useState(false)
  const [testPhone, setTestPhone] = useState('')
  const [testSending, setTestSending] = useState(false)
  const [testResult, setTestResult] = useState('')
  const [smsLog, setSmsLog] = useState([])

  // === Conversations state ===
  const [selectedConvoClient, setSelectedConvoClient] = useState(null)
  const [convoMessages, setConvoMessages] = useState([])
  const [convoReply, setConvoReply] = useState('')
  const [convoLoading, setConvoLoading] = useState(false)

  // === Custom Automation Builder state ===
  const [showAutomationForm, setShowAutomationForm] = useState(false)
  const [automationForm, setAutomationForm] = useState({
    name: '', campaign_type: 'after_booking', message_template: '', delay_hours: 0
  })
  const [automationSaving, setAutomationSaving] = useState(false)

  // === Client History state ===
  const [selectedClient, setSelectedClient] = useState(null)
  const [clientAppointments, setClientAppointments] = useState([])
  const [clientHistoryLoading, setClientHistoryLoading] = useState(false)

  // === Services state ===
  const [showServiceForm, setShowServiceForm] = useState(false)
  const [serviceForm, setServiceForm] = useState({ name: '', category: 'core', duration_minutes: 30, price: 0 })
  const [editingService, setEditingService] = useState(null)
  const [serviceSaving, setServiceSaving] = useState(false)

  // === Schedule state ===
  const [scheduleSettings, setScheduleSettings] = useState({
    days: {
      monday: { enabled: true, open: '09:00', close: '19:00' },
      tuesday: { enabled: true, open: '09:00', close: '19:00' },
      wednesday: { enabled: true, open: '09:00', close: '19:00' },
      thursday: { enabled: true, open: '09:00', close: '19:00' },
      friday: { enabled: true, open: '09:00', close: '19:00' },
      saturday: { enabled: true, open: '09:00', close: '17:00' },
      sunday: { enabled: false, open: '10:00', close: '16:00' },
    },
    slot_duration: 30,
    buffer_minutes: 0,
    blocked_dates: []
  })
  const [newBlockedDate, setNewBlockedDate] = useState('')
  const [scheduleSaving, setScheduleSaving] = useState(false)

  // === Call Handling state ===
  const [callTier, setCallTier] = useState('ai_text_back')
  const [personalPhone, setPersonalPhone] = useState('')
  const [missedCallTextBack, setMissedCallTextBack] = useState(false)
  const [missedCallAutoText, setMissedCallAutoText] = useState('')
  const [callSettingsSaving, setCallSettingsSaving] = useState(false)

  useEffect(() => { if (salon?.id) load() }, [salon?.id])

  // Populate settings form when salon loads
  useEffect(() => {
    if (salon) {
      setSettingsForm({
        shop_name: salon.shop_name || '',
        owner_name: salon.owner_name || '',
        phone: salon.phone || '',
        email: salon.email || '',
        city: salon.city || '',
        state: salon.state || '',
        salon_type: salon.salon_type || '',
        passcode: salon.passcode || ''
      })
      if (salon.schedule_settings) {
        try {
          const parsed = typeof salon.schedule_settings === 'string' ? JSON.parse(salon.schedule_settings) : salon.schedule_settings
          setScheduleSettings(prev => ({ ...prev, ...parsed }))
        } catch {}
      }
      setCallTier(salon.call_handling_tier || 'ai_text_back')
      setPersonalPhone(salon.personal_phone || '')
      setMissedCallTextBack(salon.missed_call_text_back || false)
      setMissedCallAutoText(salon.missed_call_auto_text || "Hey! Sorry I missed your call. I'm with a client right now. Book your appointment here: {{booking_link}}")
      // Load SMS log
      sb().from('sms_log').select('*').eq('salon_id', salon.id).order('created_at', { ascending: false }).limit(50)
        .then(({ data }) => setSmsLog(data || []))
    }
  }, [salon])

  if (!salon) return <div style={{ minHeight: '100vh', background: '#080808' }} />

  const load = async () => {
    if (!salon?.id) return
    const [sv, ap, rv, cl, cp, ai] = await Promise.all([
      sb().from('salon_services').select('*').eq('salon_id', salon.id).order('sort_order'),
      sb().from('salon_appointments').select('*').eq('salon_id', salon.id).order('created_at', { ascending: false }).limit(100),
      sb().from('salon_reviews').select('*').eq('salon_id', salon.id).order('created_at', { ascending: false }),
      sb().from('clients').select('*').eq('salon_id', salon.id).order('created_at', { ascending: false }).limit(100),
      sb().from('salon_campaigns').select('*').eq('salon_id', salon.id).order('campaign_type'),
      sb().from('ai_conversations').select('*').eq('salon_id', salon.id).order('created_at', { ascending: false }).limit(50),
    ])
    setData({
      services: sv.data || [],
      appointments: ap.data || [],
      reviews: rv.data || [],
      clients: cl.data || [],
      campaigns: cp.data || [],
      ai_conversations: ai.data || [],
      messages: ai.data || []
    })
    setLoading(false)
  }

  // ========== ACTIONS ==========

  const deleteReview = async (id) => {
    if (!window.confirm('Remove this review from your page?')) return
    await sb().from('salon_reviews').update({ is_visible: false }).eq('id', id)
    setData(d => ({ ...d, reviews: d.reviews.filter(r => r.id !== id) }))
  }
  const toggleCampaign = async (c) => {
    const upd = { ...c, is_active: !c.is_active }
    await sb().from('salon_campaigns').update({ is_active: upd.is_active }).eq('id', c.id)
    setData(d => ({ ...d, campaigns: d.campaigns.map(x => x.id === c.id ? upd : x) }))
  }
  const updateApptStatus = async (id, status) => {
    await sb().from('salon_appointments').update({ status }).eq('id', id)
    setData(d => ({ ...d, appointments: d.appointments.map(a => a.id === id ? { ...a, status } : a) }))
  }

  // --- Settings save ---
  const saveSettings = async () => {
    setSettingsSaving(true)
    try {
      await sb().from('salons').update({
        shop_name: settingsForm.shop_name,
        owner_name: settingsForm.owner_name,
        phone: settingsForm.phone,
        email: settingsForm.email,
        city: settingsForm.city,
        state: settingsForm.state,
        salon_type: settingsForm.salon_type,
        passcode: settingsForm.passcode
      }).eq('id', salon.id)
      const updated = { ...salon, ...settingsForm }
      setSalon(updated)
      alert('Settings saved!')
    } catch { alert('Error saving settings.') }
    setSettingsSaving(false)
  }

  // --- Enable texting (auto-provision a phone number) ---
  const enableTexting = async () => {
    setProvisioning(true)
    try {
      const { data: { session } } = await sb().auth.getSession()
      const res = await fetch('/api/provision-number', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ salon_id: salon.id })
      })
      const data = await res.json()
      if (data.success) {
        const updated = { ...salon, twilio_phone_number: data.phone_number }
        setSalon(updated)
        alert(data.already_provisioned ? 'Texting is already enabled!' : 'Texting enabled! Your number: ' + data.phone_number)
      } else {
        alert('Error: ' + (data.error || 'Could not enable texting'))
      }
    } catch (e) { alert('Error: ' + e.message) }
    setProvisioning(false)
  }

  // --- Test SMS ---
  const sendTestSms = async () => {
    if (!testPhone.trim()) return
    setTestSending(true); setTestResult('')
    try {
      const { data: { session } } = await sb().auth.getSession()
      const res = await fetch('/api/send-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`
        },
        body: JSON.stringify({
          salon_id: salon.id,
          to: testPhone,
          message: `Test from ${salon.shop_name || 'ServiceMind'}! Your SMS automations are working.`,
          trigger_type: 'test'
        })
      })
      const data = await res.json()
      if (data.success) {
        setTestResult('Sent! Check your phone.')
        // Refresh SMS log
        const { data: log } = await sb().from('sms_log').select('*').eq('salon_id', salon.id).order('created_at', { ascending: false }).limit(50)
        setSmsLog(log || [])
      } else {
        setTestResult('Failed: ' + (data.error || 'Unknown error'))
      }
    } catch (e) { setTestResult('Error: ' + e.message) }
    setTestSending(false)
  }

  // --- Trigger automation (for manual fire) ---
  const fireAutomation = async (triggerType, clientPhone, clientName) => {
    try {
      const { data: { session } } = await sb().auth.getSession()
      const res = await fetch('/api/trigger-automation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`
        },
        body: JSON.stringify({
          salon_id: salon.id,
          trigger_type: triggerType,
          client_phone: clientPhone,
          client_name: clientName,
          service_name: '',
          booking_date: new Date().toLocaleDateString()
        })
      })
      const data = await res.json()
      if (data.success) {
        alert(`Sent ${data.sent} message(s)!`)
        const { data: log } = await sb().from('sms_log').select('*').eq('salon_id', salon.id).order('created_at', { ascending: false }).limit(50)
        setSmsLog(log || [])
      } else {
        alert('Error: ' + (data.error || 'Failed'))
      }
    } catch (e) { alert('Error: ' + e.message) }
  }

  // --- Conversation actions ---
  const loadConversation = async (client) => {
    setSelectedConvoClient(client)
    setConvoLoading(true)
    setConvoMessages([])
    const { data: convos } = await sb().from('ai_conversations').select('*')
      .eq('salon_id', salon.id)
      .order('created_at', { ascending: true })
      .limit(50)
    const relevant = (convos || []).filter(c => {
      const msgs = c.messages || []
      const meta = c.metadata || {}
      return meta.client_phone === client.phone ||
        msgs.some(m => m.client_phone === client.phone) ||
        c.client_phone === client.phone
    })
    setConvoMessages(relevant)
    setConvoLoading(false)
  }
  const sendConvoReply = async () => {
    if (!convoReply.trim() || !selectedConvoClient) return
    const msg = {
      salon_id: salon.id,
      type: 'sms_reply',
      channel: 'sms',
      client_phone: selectedConvoClient.phone,
      messages: [{ role: 'assistant', content: convoReply }],
      resolved: false
    }
    await sb().from('ai_conversations').insert([msg])
    setConvoMessages(prev => [...prev, { ...msg, created_at: new Date().toISOString() }])
    setConvoReply('')
  }

  // --- Custom Automation Builder ---
  const saveCustomAutomation = async () => {
    if (!automationForm.name.trim() || !automationForm.message_template.trim()) return
    setAutomationSaving(true)
    try {
      const { data: inserted } = await sb().from('salon_campaigns').insert([{
        salon_id: salon.id,
        name: automationForm.name,
        campaign_type: automationForm.campaign_type,
        message_template: automationForm.message_template,
        delay_hours: parseInt(automationForm.delay_hours) || 0,
        is_active: false
      }]).select()
      if (inserted && inserted[0]) {
        setData(d => ({ ...d, campaigns: [...d.campaigns, inserted[0]] }))
      }
      setAutomationForm({ name: '', campaign_type: 'after_booking', message_template: '', delay_hours: 0 })
      setShowAutomationForm(false)
      alert('Automation created!')
    } catch { alert('Error creating automation.') }
    setAutomationSaving(false)
  }

  // --- Client History ---
  const loadClientHistory = async (client) => {
    setSelectedClient(client)
    setClientHistoryLoading(true)
    const { data: appts } = await sb().from('salon_appointments').select('*')
      .eq('salon_id', salon.id)
      .eq('client_phone', client.phone)
      .order('appointment_date', { ascending: false })
    setClientAppointments(appts || [])
    setClientHistoryLoading(false)
  }

  // --- Service Management ---
  const saveService = async () => {
    if (!serviceForm.name.trim()) return
    setServiceSaving(true)
    try {
      if (editingService) {
        await sb().from('salon_services').update({
          name: serviceForm.name,
          category: serviceForm.category,
          duration_minutes: parseInt(serviceForm.duration_minutes) || 30,
          price: parseFloat(serviceForm.price) || 0
        }).eq('id', editingService.id)
        setData(d => ({
          ...d,
          services: d.services.map(s => s.id === editingService.id ? { ...s, ...serviceForm, duration_minutes: parseInt(serviceForm.duration_minutes) || 30, price: parseFloat(serviceForm.price) || 0 } : s)
        }))
        setEditingService(null)
      } else {
        const maxOrder = data.services.reduce((max, s) => Math.max(max, s.sort_order || 0), -1)
        const { data: inserted } = await sb().from('salon_services').insert([{
          salon_id: salon.id,
          name: serviceForm.name,
          category: serviceForm.category,
          duration_minutes: parseInt(serviceForm.duration_minutes) || 30,
          price: parseFloat(serviceForm.price) || 0,
          is_addon: serviceForm.category === 'addon',
          sort_order: maxOrder + 1
        }]).select()
        if (inserted && inserted[0]) {
          setData(d => ({ ...d, services: [...d.services, inserted[0]] }))
        }
      }
      setServiceForm({ name: '', category: 'core', duration_minutes: 30, price: 0 })
      setShowServiceForm(false)
    } catch { alert('Error saving service.') }
    setServiceSaving(false)
  }
  const deleteService = async (id) => {
    if (!window.confirm('Delete this service?')) return
    await sb().from('salon_services').delete().eq('id', id)
    setData(d => ({ ...d, services: d.services.filter(s => s.id !== id) }))
  }
  const moveService = async (id, direction) => {
    const sorted = [...data.services].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    const idx = sorted.findIndex(s => s.id === id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sorted.length) return
    const temp = sorted[idx].sort_order
    sorted[idx].sort_order = sorted[swapIdx].sort_order
    sorted[swapIdx].sort_order = temp
    await sb().from('salon_services').update({ sort_order: sorted[idx].sort_order }).eq('id', sorted[idx].id)
    await sb().from('salon_services').update({ sort_order: sorted[swapIdx].sort_order }).eq('id', sorted[swapIdx].id)
    setData(d => ({ ...d, services: sorted }))
  }

  // --- Schedule save ---
  const saveSchedule = async () => {
    setScheduleSaving(true)
    try {
      await sb().from('salons').update({ schedule_settings: scheduleSettings }).eq('id', salon.id)
      const updated = { ...salon, schedule_settings: scheduleSettings }
      setSalon(updated)
      alert('Schedule saved!')
    } catch { alert('Error saving schedule.') }
    setScheduleSaving(false)
  }

  // --- AI Advisor ---
  const askAi = async (overrideQuery) => {
    const query = overrideQuery || aiQuery
    if (!query.trim()) return
    setAiLoading(true); setAiResponse('')
    const { appointments, reviews, clients, campaigns } = data
    const today = new Date().toISOString().split('T')[0]
    const todayAppts = appointments.filter(a => a.appointment_date === today).length
    const revenue = appointments.filter(a => a.status === 'completed').reduce((s, a) => s + (a.total_price || 0), 0)
    const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.stars, 0) / reviews.length).toFixed(1) : 'none'
    const context = `You are the AI business advisor for ${salon.shop_name}, a ${salon.salon_type} owned by ${salon.owner_name} in ${salon.city}, ${salon.state}. You have access to their business data and your job is to give direct, actionable advice to help them grow. Be specific, concise, and confident. Never hedge. Business context: Shop: ${salon.shop_name} | Owner: ${salon.owner_name} | Type: ${salon.salon_type} | City: ${salon.city}, ${salon.state} | Today's appointments: ${todayAppts} | Total clients: ${clients.length} | Completed appointments revenue: $${revenue} | Avg review rating: ${avgRating} | Active campaigns: ${campaigns.filter(c => c.is_active).length}`
    try {
      const { data: { session } } = await sb().auth.getSession()
      const res = await fetch('/api/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ salon_id: salon.id, message: query, context })
      })
      const d = await res.json()
      setAiResponse(d.response || d.error || 'Unable to get a response right now.')
    } catch { setAiResponse('AI advisor is temporarily unavailable. Please try again.') }
    setAiLoading(false)
  }

  // ========== COMPUTED ==========

  const { appointments, reviews, clients, campaigns } = data
  const today = new Date().toISOString().split('T')[0]
  const todayAppts = appointments.filter(a => a.appointment_date === today)
  const revenue = appointments.filter(a => a.status === 'completed').reduce((s, a) => s + (a.total_price || 0), 0)
  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.stars, 0) / reviews.length).toFixed(1) : 'â'
  const statusColor = { confirmed: 'var(--gold)', completed: 'var(--green)', cancelled: 'var(--red)', no_show: 'var(--muted)', pending: 'var(--blue)' }

  const referredClients = clients.filter(c => c.referred_by)
  const totalReferrals = referredClients.length

  const buildNotifications = () => {
    const notifs = []
    appointments.slice(0, 15).forEach(a => {
      notifs.push({ icon: 'ð', text: `${a.client_name} booked ${a.service_name} for ${a.appointment_date}`, time: a.created_at, type: 'booking' })
    })
    reviews.slice(0, 10).forEach(r => {
      notifs.push({ icon: 'â­', text: `${r.author_name} left a ${r.stars}-star review`, time: r.created_at, type: 'review' })
    })
    campaigns.filter(c => c.is_active).forEach(c => {
      notifs.push({ icon: 'â¡', text: `Automation "${c.name}" is running`, time: c.updated_at || c.created_at, type: 'automation' })
    })
    return notifs.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 30)
  }
  const timeAgo = (dateStr) => {
    if (!dateStr) return ''
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    return `${days}d ago`
  }

  // ========== SHARED COMPONENTS ==========

  const Dot = ({ on }) => <div style={{ width: 7, height: 7, borderRadius: '50%', background: on ? 'var(--green)' : 'var(--muted)', flexShrink: 0 }} />
  const Badge = ({ text, color = 'var(--gold)' }) => <span style={{ fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color, border: `1px solid ${color}`, padding: '2px 8px', opacity: .9 }}>{text}</span>
  const Empty = ({ main, sub }) => (
    <div style={{ border: '1px dashed var(--border-dim)', padding: '80px 32px', textAlign: 'center' }}>
      <div className="cormorant" style={{ fontSize: 22, fontStyle: 'italic', color: 'var(--muted)', marginBottom: 8 }}>{main}</div>
      <div style={{ fontSize: 12, color: 'var(--muted)', opacity: .6 }}>{sub}</div>
    </div>
  )
  const Stat = ({ label, value, sub, accent }) => (
    <div style={{ background: 'var(--dark-2)', padding: '26px', border: '1px solid var(--border-dim)', flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 10, letterSpacing: '.25em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 12 }}>{label}</div>
      <div className="cormorant" style={{ fontSize: 44, fontWeight: 300, color: accent || 'var(--gold)', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>{sub}</div>}
    </div>
  )
  const FieldLabel = ({ children }) => (
    <label style={{ fontSize: 10, letterSpacing: '.25em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: 7 }}>{children}</label>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--black)' }}>

      {/* SIDEBAR */}
      <div style={{ width: 240, background: 'var(--dark)', borderRight: '1px solid var(--border-dim)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '28px 24px', borderBottom: '1px solid var(--border-dim)' }}>
          <div className="cinzel" style={{ fontSize: 13, letterSpacing: '.3em', color: 'var(--gold)', marginBottom: 4 }}>ServiceMind</div>
          <div style={{ fontSize: 9, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>Salon Dashboard</div>
        </div>
        <div style={{ padding: '16px 0', flex: 1, overflowY: 'auto' }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setTab(n.id)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '13px 24px', background: tab === n.id ? 'rgba(201,168,76,.07)' : 'transparent', border: 'none', borderLeft: `2px solid ${tab === n.id ? 'var(--gold)' : 'transparent'}`, color: tab === n.id ? 'var(--gold)' : 'var(--muted)', fontSize: 11, letterSpacing: '.15em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all .15s' }}>
              {n.label}
            </button>
          ))}
        </div>
        <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border-dim)' }}>
          <div style={{ fontSize: 14, color: 'var(--text)', marginBottom: 3, fontWeight: 400 }}>{salon.shop_name}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 14 }}>{salon.owner_name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Dot on={salon.subscription_status === 'active' || salon.subscription_status === 'trial'} />
            <span style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '.15em', textTransform: 'uppercase' }}>{salon.subscription_status}</span>
          </div>
          <button onClick={() => sb().auth.signOut().then(() => router.push('/login'))} className="btn-ghost" style={{ padding: '8px 16px', fontSize: 9, width: '100%', textAlign: 'center' }}>Log Out</button>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* TOP BAR */}
        <div style={{ padding: '20px 48px', borderBottom: '1px solid var(--border-dim)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--black)', position: 'sticky', top: 0, zIndex: 10 }}>
          <div>
            <div className="cinzel" style={{ fontSize: 14, letterSpacing: '.2em', color: 'var(--text)' }}>{NAV.find(n => n.id === tab)?.label}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {salon.phone && <span style={{ fontSize: 12, color: 'var(--muted)' }}>{salon.phone}</span>}
            <a href={`/book/${salon.slug}`} target="_blank" rel="noreferrer"
              className="cinzel" style={{ fontSize: 10, letterSpacing: '.15em', color: 'var(--gold)', border: '1px solid var(--border)', padding: '8px 16px', cursor: 'pointer', textDecoration: 'none' }}>
              Booking Page â
            </a>
          </div>
        </div>

        <div style={{ padding: '48px' }}>
          {loading && <div className="cinzel" style={{ textAlign: 'center', color: 'var(--muted)', padding: 80, letterSpacing: '.2em', fontSize: 11 }}>Loading...</div>}

          {/* ==================== OVERVIEW ==================== */}
          {!loading && tab === 'overview' && (
            <div>
              <div style={{ display: 'flex', gap: 2, marginBottom: 44 }}>
                <Stat label="Today's Appointments" value={todayAppts.length} sub={`${appointments.length} total all time`} />
                <Stat label="Total Clients" value={clients.length} sub="in your database" />
                <Stat label="Avg Rating" value={avgRating} sub={`${reviews.length} reviews`} />
                <Stat label="Revenue Tracked" value={`$${revenue.toLocaleString()}`} sub="completed appointments" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 2 }}>
                <div>
                  <div className="cinzel" style={{ fontSize: 10, letterSpacing: '.25em', color: 'var(--gold)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                    Today&apos;s Schedule
                    <span style={{ flex: 1, height: 1, background: 'var(--border-dim)' }} />
                  </div>
                  {todayAppts.length === 0
                    ? <Empty main="No appointments today" sub="Bookings from your site appear here automatically." />
                    : todayAppts.map(a => (
                      <div key={a.id} className="card" style={{ padding: '18px 22px', marginBottom: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: 14, color: 'var(--text)', marginBottom: 3 }}>{a.client_name}</div>
                          <div style={{ fontSize: 11, color: 'var(--muted)' }}>{a.service_name} Â· {a.appointment_time} Â· <span style={{ color: 'var(--gold)' }}>${a.total_price}</span></div>
                        </div>
                        <Badge text={a.status} color={statusColor[a.status] || 'var(--muted)'} />
                      </div>
                    ))
                  }
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div className="card" style={{ padding: '28px', flex: 1 }}>
                    <div className="cinzel" style={{ fontSize: 10, letterSpacing: '.2em', color: 'var(--gold)', marginBottom: 16 }}>Automations</div>
                    {campaigns.slice(0, 6).map(c => (
                      <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <Dot on={c.is_active} />
                        <span style={{ fontSize: 12, color: c.is_active ? 'var(--text)' : 'var(--muted)' }}>{c.name}</span>
                      </div>
                    ))}
                  </div>
                  <div className="card" style={{ padding: '28px' }}>
                    <div className="cinzel" style={{ fontSize: 10, letterSpacing: '.2em', color: 'var(--gold)', marginBottom: 16 }}>Shop Details</div>
                    {[['Type', salon.salon_type], ['City', [salon.city, salon.state].filter(Boolean).join(', ') || 'â'], ['Plan', salon.subscription_tier], ['Status', salon.subscription_status]].map(([l, v]) => (
                      <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 12 }}>
                        <span style={{ color: 'var(--muted)' }}>{l}</span>
                        <span style={{ color: 'var(--text)', textTransform: 'capitalize' }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== APPOINTMENTS ==================== */}
          {!loading && tab === 'appointments' && (
            <div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 32 }}>{appointments.length} total Â· {todayAppts.length} today</div>
              {appointments.length === 0 ? <Empty main="No appointments yet" sub="Bookings through your site appear here automatically." /> :
                appointments.map(a => (
                  <div key={a.id} className="card" style={{ padding: '18px 24px', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'space-between' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>{a.client_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{a.service_name} Â· {a.appointment_date} at {a.appointment_time} Â· <span style={{ color: 'var(--gold)' }}>${a.total_price}</span></div>
                      {a.client_phone && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{a.client_phone}</div>}
                    </div>
                    <select style={{ background: 'var(--dark-3)', border: '1px solid var(--border-dim)', color: 'var(--text)', padding: '8px 12px', fontSize: 11, outline: 'none', borderRadius: 0, cursor: 'pointer', flexShrink: 0 }}
                      value={a.status} onChange={e => updateApptStatus(a.id, e.target.value)}>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="no_show">No Show</option>
                    </select>
                  </div>
                ))
              }
            </div>
          )}

          {/* ==================== CLIENTS (with history) ==================== */}
          {!loading && tab === 'clients' && (
            <div>
              {selectedClient ? (
                <div>
                  <button onClick={() => { setSelectedClient(null); setClientAppointments([]) }}
                    className="btn-ghost" style={{ padding: '8px 20px', fontSize: 10, marginBottom: 28 }}>
                    â Back to Clients
                  </button>
                  <div className="card-gold" style={{ padding: '36px', marginBottom: 24, position: 'relative' }}>
                    <div className="gold-line-top" />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
                      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(201,168,76,.3), var(--dark-3))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, color: 'var(--gold)', fontFamily: 'Cinzel', flexShrink: 0 }}>
                        {(selectedClient.name || 'C').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="cormorant" style={{ fontSize: 32, fontWeight: 300, color: 'var(--text)' }}>{selectedClient.name || 'Unknown'}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{selectedClient.phone || 'No phone'}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 2 }}>
                      <Stat label="Total Visits" value={selectedClient.total_visits || 0} />
                      <Stat label="Total Spent" value={`$${selectedClient.total_spent || 0}`} />
                      <Stat label="Last Visit" value={selectedClient.last_visit_at ? new Date(selectedClient.last_visit_at).toLocaleDateString() : 'â'} />
                    </div>
                  </div>
                  <div className="cinzel" style={{ fontSize: 10, letterSpacing: '.25em', color: 'var(--gold)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                    Appointment History
                    <span style={{ flex: 1, height: 1, background: 'var(--border-dim)' }} />
                  </div>
                  {clientHistoryLoading ? (
                    <div className="cinzel" style={{ textAlign: 'center', color: 'var(--muted)', padding: 40, fontSize: 11 }}>Loading...</div>
                  ) : clientAppointments.length === 0 ? (
                    <Empty main="No appointment history" sub="Past appointments for this client will appear here." />
                  ) : (
                    clientAppointments.map(a => (
                      <div key={a.id} className="card" style={{ padding: '18px 24px', marginBottom: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 3 }}>{a.service_name}</div>
                          <div style={{ fontSize: 11, color: 'var(--muted)' }}>{a.appointment_date} at {a.appointment_time} Â· <span style={{ color: 'var(--gold)' }}>${a.total_price}</span></div>
                        </div>
                        <Badge text={a.status} color={statusColor[a.status] || 'var(--muted)'} />
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 32 }}>{clients.length} clients in your database</div>
                  {clients.length === 0 ? <Empty main="No clients yet" sub="Every person who books appears here automatically." /> :
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 2 }}>
                      {clients.map(c => (
                        <div key={c.id} className="card" onClick={() => loadClientHistory(c)}
                          style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', transition: 'border-color .2s' }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border)'}
                          onMouseLeave={e => e.currentTarget.style.borderColor = ''}>
                          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(201,168,76,.3), var(--dark-3))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: 'var(--gold)', fontFamily: 'Cinzel', flexShrink: 0 }}>
                            {(c.name || 'C').charAt(0).toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 3 }}>{c.name || 'Unknown'}</div>
                            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{c.phone || 'No phone'} Â· {c.total_visits} visits Â· <span style={{ color: 'var(--gold)' }}>${c.total_spent}</span></div>
                          </div>
                          {c.last_visit_at && <div style={{ fontSize: 10, color: 'var(--muted)', textAlign: 'right', flexShrink: 0 }}>{new Date(c.last_visit_at).toLocaleDateString()}</div>}
                        </div>
                      ))}
                    </div>
                  }
                </div>
              )}
            </div>
          )}

          {/* ==================== REVIEWS ==================== */}
          {!loading && tab === 'reviews' && (
            <div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 32 }}>
                {reviews.length} reviews Â· {avgRating}â average Â· <span style={{ color: 'var(--gold)' }}>You can remove any review</span>
              </div>
              {reviews.length === 0 ? <Empty main="No reviews yet" sub="Reviews submitted on your booking site appear here. You control what stays visible." /> :
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 2 }}>
                  {reviews.map(r => (
                    <div key={r.id} className="card" style={{ padding: '28px', position: 'relative' }}>
                      <button onClick={() => deleteReview(r.id)} style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(192,57,43,.08)', border: '1px solid rgba(192,57,43,.2)', color: 'var(--red)', fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', padding: '4px 10px', cursor: 'pointer' }}>
                        Remove
                      </button>
                      <div style={{ color: 'var(--gold)', fontSize: 12, letterSpacing: 3, marginBottom: 12 }}>{'â'.repeat(r.stars)}{'â'.repeat(5 - r.stars)}</div>
                      <div className="cormorant" style={{ fontSize: 16, fontStyle: 'italic', lineHeight: 1.7, color: 'var(--text)', marginBottom: 14 }}>&quot;{r.review_text}&quot;</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{r.author_name} Â· {r.service_received} Â· {new Date(r.created_at).toLocaleDateString()}</div>
                    </div>
                  ))}
                </div>
              }
            </div>
          )}

          {/* ==================== AUTOMATIONS + BUILDER ==================== */}
          {!loading && tab === 'campaigns' && (
            <div>
              <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.8, marginBottom: 32 }}>
                Toggle your automations on or off. When enabled, these messages go out automatically to clients via SMS. Variables like <span style={{ color: 'var(--gold)' }}>{'{{shop_name}}'}</span> are filled in automatically.
              </div>

              <div style={{ marginBottom: 28 }}>
                <button onClick={() => setShowAutomationForm(!showAutomationForm)}
                  className="btn-gold" style={{ padding: '12px 28px', fontSize: 10 }}>
                  {showAutomationForm ? 'Cancel' : '+ Create Custom Automation'}
                </button>
              </div>

              {showAutomationForm && (
                <div className="card-gold" style={{ padding: '32px', marginBottom: 28, position: 'relative' }}>
                  <div className="gold-line-top" />
                  <div className="eyebrow" style={{ marginBottom: 20 }}>New Automation</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    <div>
                      <FieldLabel>Automation Name</FieldLabel>
                      <input className="input" placeholder="e.g. VIP Follow-Up" value={automationForm.name}
                        onChange={e => setAutomationForm(f => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div>
                      <FieldLabel>Trigger Type</FieldLabel>
                      <select className="input" value={automationForm.campaign_type}
                        onChange={e => setAutomationForm(f => ({ ...f, campaign_type: e.target.value }))}>
                        <option value="after_booking">After Booking</option>
                        <option value="missed_call">Missed Call</option>
                        <option value="no_show">No Show</option>
                        <option value="birthday">Birthday</option>
                        <option value="win_back">Win Back</option>
                        <option value="slow_day">Slow Day</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <FieldLabel>Message Template</FieldLabel>
                    <textarea className="input" rows={4} placeholder={'Hey {{client_name}}, thanks for visiting {{shop_name}}! ...'}
                      value={automationForm.message_template}
                      onChange={e => setAutomationForm(f => ({ ...f, message_template: e.target.value }))}
                      style={{ resize: 'vertical' }} />
                    <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 6 }}>
                      Available: <span style={{ color: 'var(--gold)' }}>{'{{client_name}} {{shop_name}} {{service_name}} {{booking_date}} {{owner_name}}'}</span>
                    </div>
                  </div>
                  <div style={{ marginBottom: 20, maxWidth: 200 }}>
                    <FieldLabel>Delay (hours after trigger)</FieldLabel>
                    <input className="input" type="number" min="0" value={automationForm.delay_hours}
                      onChange={e => setAutomationForm(f => ({ ...f, delay_hours: e.target.value }))} />
                  </div>
                  <button onClick={saveCustomAutomation} disabled={automationSaving}
                    className="btn-gold" style={{ padding: '12px 28px', fontSize: 10, opacity: automationSaving ? .5 : 1 }}>
                    {automationSaving ? 'Saving...' : 'Save Automation'}
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {campaigns.map(c => (
                  <div key={c.id} style={{ background: 'var(--dark)', border: `1px solid ${c.is_active ? 'var(--border)' : 'var(--border-dim)'}`, padding: '22px 28px', transition: 'border-color .2s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: c.message_template ? 12 : 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <Dot on={c.is_active} />
                        <div>
                          <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 2 }}>{c.name}</div>
                          <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '.12em', textTransform: 'uppercase' }}>{c.campaign_type.replace(/_/g, ' ')}</div>
                        </div>
                      </div>
                      <button onClick={() => toggleCampaign(c)} className={c.is_active ? 'btn-ghost' : 'btn-gold'} style={{ padding: '8px 20px', fontSize: 10 }}>
                        {c.is_active ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                    {c.message_template && (
                      <div style={{ background: 'var(--dark-3)', border: '1px solid var(--border-dim)', padding: '12px 16px', fontSize: 12, color: 'var(--muted)', lineHeight: 1.7, marginLeft: 22, fontStyle: 'italic' }}>
                        &quot;{c.message_template}&quot;
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================== SERVICES ==================== */}
          {!loading && tab === 'services' && (
            <div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24 }}>{data.services.length} services configured</div>
              <div style={{ marginBottom: 28 }}>
                <button onClick={() => { setShowServiceForm(!showServiceForm); setEditingService(null); setServiceForm({ name: '', category: 'core', duration_minutes: 30, price: 0 }) }}
                  className="btn-gold" style={{ padding: '12px 28px', fontSize: 10 }}>
                  {showServiceForm ? 'Cancel' : '+ Add Service'}
                </button>
              </div>

              {showServiceForm && (
                <div className="card-gold" style={{ padding: '32px', marginBottom: 28, position: 'relative' }}>
                  <div className="gold-line-top" />
                  <div className="eyebrow" style={{ marginBottom: 20 }}>{editingService ? 'Edit Service' : 'New Service'}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    <div>
                      <FieldLabel>Service Name</FieldLabel>
                      <input className="input" placeholder="e.g. Signature Fade" value={serviceForm.name}
                        onChange={e => setServiceForm(f => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div>
                      <FieldLabel>Category</FieldLabel>
                      <select className="input" value={serviceForm.category}
                        onChange={e => setServiceForm(f => ({ ...f, category: e.target.value }))}>
                        <option value="core">Core</option>
                        <option value="luxury">Luxury</option>
                        <option value="vip">VIP</option>
                        <option value="addon">Add-On</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                    <div>
                      <FieldLabel>Duration (minutes)</FieldLabel>
                      <input className="input" type="number" min="5" value={serviceForm.duration_minutes}
                        onChange={e => setServiceForm(f => ({ ...f, duration_minutes: e.target.value }))} />
                    </div>
                    <div>
                      <FieldLabel>Price ($)</FieldLabel>
                      <input className="input" type="number" min="0" step="0.01" value={serviceForm.price}
                        onChange={e => setServiceForm(f => ({ ...f, price: e.target.value }))} />
                    </div>
                  </div>
                  <button onClick={saveService} disabled={serviceSaving}
                    className="btn-gold" style={{ padding: '12px 28px', fontSize: 10, opacity: serviceSaving ? .5 : 1 }}>
                    {serviceSaving ? 'Saving...' : editingService ? 'Update Service' : 'Add Service'}
                  </button>
                </div>
              )}

              {['core', 'luxury', 'vip', 'addon'].map(cat => {
                const catServices = data.services.filter(s => s.category === cat).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                if (catServices.length === 0) return null
                return (
                  <div key={cat} style={{ marginBottom: 32 }}>
                    <div className="cinzel" style={{ fontSize: 10, letterSpacing: '.25em', color: 'var(--gold)', marginBottom: 12, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 12 }}>
                      {cat === 'addon' ? 'Add-Ons' : cat}
                      <span style={{ flex: 1, height: 1, background: 'var(--border-dim)' }} />
                    </div>
                    {catServices.map(s => (
                      <div key={s.id} className="card" style={{ padding: '18px 24px', marginBottom: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, color: 'var(--text)', marginBottom: 3 }}>{s.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--muted)' }}>{s.duration_minutes}min Â· <span style={{ color: 'var(--gold)' }}>${s.price}</span></div>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => moveService(s.id, 'up')} style={{ background: 'transparent', border: '1px solid var(--border-dim)', color: 'var(--muted)', padding: '4px 8px', fontSize: 10, cursor: 'pointer' }}>â</button>
                          <button onClick={() => moveService(s.id, 'down')} style={{ background: 'transparent', border: '1px solid var(--border-dim)', color: 'var(--muted)', padding: '4px 8px', fontSize: 10, cursor: 'pointer' }}>â</button>
                          <button onClick={() => {
                            setEditingService(s)
                            setServiceForm({ name: s.name, category: s.category, duration_minutes: s.duration_minutes, price: s.price })
                            setShowServiceForm(true)
                          }} style={{ background: 'transparent', border: '1px solid var(--border-dim)', color: 'var(--gold)', padding: '4px 10px', fontSize: 9, cursor: 'pointer', letterSpacing: '.1em', textTransform: 'uppercase' }}>Edit</button>
                          <button onClick={() => deleteService(s.id)} style={{ background: 'rgba(192,57,43,.08)', border: '1px solid rgba(192,57,43,.2)', color: 'var(--red)', padding: '4px 10px', fontSize: 9, cursor: 'pointer', letterSpacing: '.1em', textTransform: 'uppercase' }}>Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          )}

          {/* ==================== CONVERSATIONS ==================== */}
          {!loading && tab === 'conversations' && (
            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 2, minHeight: 500 }}>
              <div style={{ background: 'var(--dark)', border: '1px solid var(--border-dim)', overflowY: 'auto', maxHeight: 600 }}>
                <div className="cinzel" style={{ fontSize: 10, letterSpacing: '.2em', color: 'var(--gold)', padding: '18px 20px', borderBottom: '1px solid var(--border-dim)' }}>Clients</div>
                {clients.length === 0 ? (
                  <div style={{ padding: 20, fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>No clients yet</div>
                ) : clients.map(c => (
                  <div key={c.id} onClick={() => loadConversation(c)}
                    style={{
                      padding: '14px 20px', cursor: 'pointer', borderBottom: '1px solid var(--border-dim)',
                      background: selectedConvoClient?.id === c.id ? 'rgba(201,168,76,.07)' : 'transparent',
                      borderLeft: selectedConvoClient?.id === c.id ? '2px solid var(--gold)' : '2px solid transparent',
                      transition: 'all .15s'
                    }}>
                    <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 2 }}>{c.name || 'Unknown'}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>{c.phone || 'No phone'}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: 'var(--dark)', border: '1px solid var(--border-dim)', display: 'flex', flexDirection: 'column' }}>
                {!selectedConvoClient ? (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="cormorant" style={{ fontSize: 20, fontStyle: 'italic', color: 'var(--muted)' }}>Select a client to view conversation</div>
                  </div>
                ) : (
                  <>
                    <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-dim)', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(201,168,76,.3), var(--dark-3))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'var(--gold)', fontFamily: 'Cinzel' }}>
                        {(selectedConvoClient.name || 'C').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, color: 'var(--text)' }}>{selectedConvoClient.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--muted)' }}>{selectedConvoClient.phone}</div>
                      </div>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', maxHeight: 400 }}>
                      {convoLoading ? (
                        <div className="cinzel" style={{ textAlign: 'center', color: 'var(--muted)', padding: 40, fontSize: 11 }}>Loading...</div>
                      ) : convoMessages.length === 0 ? (
                        <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 40, fontSize: 12 }}>No messages yet</div>
                      ) : (
                        convoMessages.map((convo, idx) => (
                          <div key={idx} style={{ marginBottom: 16 }}>
                            {(convo.messages || []).map((m, mi) => (
                              <div key={mi} style={{
                                display: 'flex', justifyContent: m.role === 'assistant' ? 'flex-start' : 'flex-end', marginBottom: 8
                              }}>
                                <div style={{
                                  maxWidth: '70%', padding: '10px 16px', fontSize: 13, lineHeight: 1.6,
                                  background: m.role === 'assistant' ? 'var(--dark-3)' : 'rgba(201,168,76,.12)',
                                  border: `1px solid ${m.role === 'assistant' ? 'var(--border-dim)' : 'var(--border)'}`,
                                  color: 'var(--text-2)'
                                }}>
                                  {m.content}
                                </div>
                              </div>
                            ))}
                            <div style={{ fontSize: 9, color: 'var(--muted)', textAlign: 'right' }}>{timeAgo(convo.created_at)}</div>
                          </div>
                        ))
                      )}
                    </div>
                    <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border-dim)', display: 'flex', gap: 8 }}>
                      <input className="input" placeholder="Type a reply..." value={convoReply}
                        onChange={e => setConvoReply(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendConvoReply()}
                        style={{ flex: 1 }} />
                      <button onClick={sendConvoReply} className="btn-gold" style={{ padding: '14px 24px', fontSize: 10 }}>Send</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ==================== REFERRALS ==================== */}
          {!loading && tab === 'referrals' && (
            <div>
              <div style={{ display: 'flex', gap: 2, marginBottom: 32 }}>
                <Stat label="Total Referrals" value={totalReferrals} sub="clients referred by others" />
                <Stat label="Referral Revenue" value={`$${referredClients.reduce((s, c) => s + (c.total_spent || 0), 0)}`} sub="from referred clients" />
              </div>

              <div className="card-gold" style={{ padding: '28px', marginBottom: 28, position: 'relative' }}>
                <div className="gold-line-top" />
                <div className="eyebrow" style={{ marginBottom: 12 }}>Your Referral Link</div>
                <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.8, marginBottom: 16 }}>
                  Share this with clients. Replace CLIENT_PHONE with their number to track referrals.
                </div>
                <div style={{ background: 'var(--dark-3)', border: '1px solid var(--border-dim)', padding: '14px 18px', fontSize: 13, color: 'var(--gold)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  servicemind.vercel.app/book/{salon.slug}?ref=CLIENT_PHONE
                </div>
              </div>

              <div className="cinzel" style={{ fontSize: 10, letterSpacing: '.25em', color: 'var(--gold)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                Referred Clients
                <span style={{ flex: 1, height: 1, background: 'var(--border-dim)' }} />
              </div>
              {referredClients.length === 0 ? (
                <Empty main="No referrals yet" sub="When a client books with a referral link, they'll appear here." />
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['Client', 'Referred By', 'Date Joined', 'Visits', 'Spent'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted)', borderBottom: '1px solid var(--border-dim)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {referredClients.map(c => (
                        <tr key={c.id} style={{ borderBottom: '1px solid var(--border-dim)' }}>
                          <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text)' }}>{c.name || 'Unknown'}</td>
                          <td style={{ padding: '14px 16px', fontSize: 12, color: 'var(--gold)' }}>{c.referred_by}</td>
                          <td style={{ padding: '14px 16px', fontSize: 12, color: 'var(--muted)' }}>{c.created_at ? new Date(c.created_at).toLocaleDateString() : 'â'}</td>
                          <td style={{ padding: '14px 16px', fontSize: 12, color: 'var(--text)' }}>{c.total_visits || 0}</td>
                          <td style={{ padding: '14px 16px', fontSize: 12, color: 'var(--gold)' }}>${c.total_spent || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ==================== SCHEDULE ==================== */}
          {!loading && tab === 'schedule' && (
            <div>
              <div className="card-gold" style={{ padding: '36px', marginBottom: 28, position: 'relative' }}>
                <div className="gold-line-top" />
                <div className="eyebrow" style={{ marginBottom: 20 }}>Weekly Hours</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {Object.entries(scheduleSettings.days).map(([day, cfg]) => (
                    <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 0', borderBottom: '1px solid var(--border-dim)' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 10, width: 140, cursor: 'pointer' }}>
                        <input type="checkbox" checked={cfg.enabled}
                          onChange={e => setScheduleSettings(s => ({ ...s, days: { ...s.days, [day]: { ...cfg, enabled: e.target.checked } } }))} />
                        <span style={{ fontSize: 13, color: cfg.enabled ? 'var(--text)' : 'var(--muted)', textTransform: 'capitalize' }}>{day}</span>
                      </label>
                      {cfg.enabled && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input type="time" className="input" value={cfg.open} style={{ width: 130, padding: '8px 12px' }}
                            onChange={e => setScheduleSettings(s => ({ ...s, days: { ...s.days, [day]: { ...cfg, open: e.target.value } } }))} />
                          <span style={{ color: 'var(--muted)', fontSize: 12 }}>to</span>
                          <input type="time" className="input" value={cfg.close} style={{ width: 130, padding: '8px 12px' }}
                            onChange={e => setScheduleSettings(s => ({ ...s, days: { ...s.days, [day]: { ...cfg, close: e.target.value } } }))} />
                        </div>
                      )}
                      {!cfg.enabled && <span style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic' }}>Closed</span>}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, marginBottom: 28 }}>
                <div className="card" style={{ padding: '28px' }}>
                  <FieldLabel>Slot Duration</FieldLabel>
                  <select className="input" value={scheduleSettings.slot_duration}
                    onChange={e => setScheduleSettings(s => ({ ...s, slot_duration: parseInt(e.target.value) }))}>
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                  </select>
                </div>
                <div className="card" style={{ padding: '28px' }}>
                  <FieldLabel>Buffer Between Appointments (min)</FieldLabel>
                  <input className="input" type="number" min="0" max="60" value={scheduleSettings.buffer_minutes}
                    onChange={e => setScheduleSettings(s => ({ ...s, buffer_minutes: parseInt(e.target.value) || 0 }))} />
                </div>
              </div>

              <div className="card" style={{ padding: '28px', marginBottom: 28 }}>
                <FieldLabel>Block Specific Dates</FieldLabel>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <input type="date" className="input" value={newBlockedDate}
                    onChange={e => setNewBlockedDate(e.target.value)} style={{ flex: 1 }} />
                  <button className="btn-gold" style={{ padding: '12px 20px', fontSize: 10 }}
                    onClick={() => {
                      if (!newBlockedDate) return
                      setScheduleSettings(s => ({ ...s, blocked_dates: [...(s.blocked_dates || []), newBlockedDate] }))
                      setNewBlockedDate('')
                    }}>Block Date</button>
                </div>
                {(scheduleSettings.blocked_dates || []).length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {scheduleSettings.blocked_dates.map((d, i) => (
                      <span key={i} style={{ background: 'var(--dark-3)', border: '1px solid var(--border-dim)', padding: '6px 12px', fontSize: 12, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        {d}
                        <button onClick={() => setScheduleSettings(s => ({ ...s, blocked_dates: s.blocked_dates.filter((_, idx) => idx !== i) }))}
                          style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 12 }}>Ã</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <button onClick={saveSchedule} disabled={scheduleSaving}
                className="btn-gold" style={{ padding: '14px 32px', fontSize: 11, opacity: scheduleSaving ? .5 : 1 }}>
                {scheduleSaving ? 'Saving...' : 'Save Schedule'}
              </button>
            </div>
          )}

          {/* ==================== NOTIFICATIONS ==================== */}
          {!loading && tab === 'notifications' && (
            <div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 32 }}>Recent activity across your shop â bookings, reviews, and automations.</div>
              {(() => {
                const notifs = buildNotifications()
                return notifs.length === 0 ? (
                  <Empty main="No activity yet" sub="Bookings, reviews, and automation events will appear here." />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {notifs.map((n, i) => (
                      <div key={i} className="card" style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ fontSize: 20, flexShrink: 0 }}>{n.icon}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{n.text}</div>
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--muted)', flexShrink: 0, whiteSpace: 'nowrap' }}>{timeAgo(n.time)}</div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>
          )}

          {/* ==================== AI ADVISOR ==================== */}
          {!loading && tab === 'ai' && (
            <div>
              <div style={{ background: 'var(--dark)', border: '1px solid var(--border)', padding: '36px', marginBottom: 24, position: 'relative' }}>
                <div className="gold-line-top" />
                <div className="eyebrow" style={{ marginBottom: 20 }}>AI Business Advisor</div>
                <h3 className="cormorant" style={{ fontSize: 36, fontWeight: 300, marginBottom: 16 }}>
                  Ask your <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>AI advisor</em> anything.
                </h3>
                <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.8, marginBottom: 28 }}>
                  Your AI knows your shop â its revenue, appointment patterns, client base, and ratings. Ask it for real advice.
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="input"
                    placeholder="e.g. How can I increase revenue this month?"
                    value={aiQuery} onChange={e => setAiQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && askAi()}
                    style={{ flex: 1 }} />
                  <button onClick={askAi} disabled={aiLoading || !aiQuery.trim()} className="btn-gold" style={{ padding: '14px 28px', opacity: aiLoading || !aiQuery.trim() ? .5 : 1 }}>
                    {aiLoading ? '...' : 'Ask â'}
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                  {['What should I focus on this week?', 'Why are my no-shows high?', 'How do I get more clients?', 'Write me a slow day promo text'].map(q => (
                    <button key={q} onClick={() => { setAiQuery(q); askAi(q) }}
                      style={{ background: 'transparent', border: '1px solid var(--border-dim)', color: 'var(--muted)', padding: '6px 14px', fontSize: 11, cursor: 'pointer', borderRadius: 0 }}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
              {aiResponse && (
                <div className="card-gold" style={{ padding: '32px' }}>
                  <div className="gold-line-top" />
                  <div className="cinzel" style={{ fontSize: 10, letterSpacing: '.25em', color: 'var(--gold)', marginBottom: 16 }}>AI Advisor Response</div>
                  <div style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>{aiResponse}</div>
                </div>
              )}
            </div>
          )}

          {/* ==================== SETTINGS ==================== */}
          {!loading && tab === 'settings' && (
            <div>
              <div className="card-gold" style={{ padding: '36px', marginBottom: 24, position: 'relative' }}>
                <div className="gold-line-top" />
                <div className="eyebrow" style={{ marginBottom: 20 }}>Shop Profile</div>
                <h3 className="cormorant" style={{ fontSize: 32, fontWeight: 300, marginBottom: 24 }}>
                  Edit your <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>shop details</em>
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <FieldLabel>Shop Name</FieldLabel>
                    <input className="input" value={settingsForm.shop_name}
                      onChange={e => setSettingsForm(f => ({ ...f, shop_name: e.target.value }))} />
                  </div>
                  <div>
                    <FieldLabel>Owner Name</FieldLabel>
                    <input className="input" value={settingsForm.owner_name}
                      onChange={e => setSettingsForm(f => ({ ...f, owner_name: e.target.value }))} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <FieldLabel>Phone</FieldLabel>
                    <input className="input" value={settingsForm.phone}
                      onChange={e => setSettingsForm(f => ({ ...f, phone: e.target.value }))} />
                  </div>
                  <div>
                    <FieldLabel>Email</FieldLabel>
                    <input className="input" type="email" value={settingsForm.email}
                      onChange={e => setSettingsForm(f => ({ ...f, email: e.target.value }))} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <FieldLabel>City</FieldLabel>
                    <input className="input" value={settingsForm.city}
                      onChange={e => setSettingsForm(f => ({ ...f, city: e.target.value }))} />
                  </div>
                  <div>
                    <FieldLabel>State</FieldLabel>
                    <input className="input" value={settingsForm.state}
                      onChange={e => setSettingsForm(f => ({ ...f, state: e.target.value }))} />
                  </div>
                  <div>
                    <FieldLabel>Salon Type</FieldLabel>
                    <select className="input" value={settingsForm.salon_type}
                      onChange={e => setSettingsForm(f => ({ ...f, salon_type: e.target.value }))}>
                      <option value="">Select type...</option>
                      <option value="barbershop">Barbershop</option>
                      <option value="hair_salon">Hair Salon</option>
                      <option value="nail_salon">Nail Salon</option>
                      <option value="spa">Spa</option>
                      <option value="beauty_studio">Beauty Studio</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: 24, maxWidth: 300 }}>
                  <FieldLabel>Dashboard Passcode</FieldLabel>
                  <input className="input" value={settingsForm.passcode}
                    onChange={e => setSettingsForm(f => ({ ...f, passcode: e.target.value }))} />
                </div>
                <button onClick={saveSettings} disabled={settingsSaving}
                  className="btn-gold" style={{ padding: '14px 32px', fontSize: 11, opacity: settingsSaving ? .5 : 1 }}>
                  {settingsSaving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>

              <div className="card-gold" style={{ padding: '36px', marginBottom: 20, position: 'relative' }}>
                <div className="gold-line-top" />
                <div className="eyebrow" style={{ marginBottom: 20 }}>Notifications</div>
                <h3 className="cormorant" style={{ fontSize: 32, fontWeight: 300, marginBottom: 8 }}>
                  Where should we send <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>alerts?</em>
                </h3>
                <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.8, marginBottom: 28 }}>
                  Get notified when a new appointment is booked, a client leaves a review, or an automation fires.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <FieldLabel>Your Phone Number (for alerts)</FieldLabel>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input className="input" placeholder={salon.phone || '(404) 000-0000'} defaultValue={salon.phone || ''}
                        id="notif-phone" style={{ flex: 1 }} />
                      <button className="btn-gold" style={{ padding: '14px 24px', whiteSpace: 'nowrap' }}
                        onClick={async () => {
                          const val = document.getElementById('notif-phone').value
                          await sb().from('salons').update({ phone: val }).eq('id', salon.id)
                          alert('Saved!')
                        }}>Save</button>
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Notification Email</FieldLabel>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input className="input" type="email" placeholder={salon.email || 'you@yourshop.com'} defaultValue={salon.email || ''}
                        id="notif-email" style={{ flex: 1 }} />
                      <button className="btn-gold" style={{ padding: '14px 24px', whiteSpace: 'nowrap' }}
                        onClick={async () => {
                          const val = document.getElementById('notif-email').value
                          await sb().from('salons').update({ email: val }).eq('id', salon.id)
                          alert('Saved!')
                        }}>Save</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Call Handling */}
              <div className="card-gold" style={{ padding: '36px', marginBottom: 20, position: 'relative' }}>
                <div className="gold-line-top" />
                <div className="eyebrow" style={{ marginBottom: 20 }}>Call Handling</div>
                <h3 className="cormorant" style={{ fontSize: 32, fontWeight: 300, marginBottom: 24 }}>
                  How should we handle <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>missed calls?</em>
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 24 }}>
                  {[
                    { id: 'ai_text_back', label: 'AI Text Back', desc: 'When someone calls and it\'s missed, AI texts them back', badge: 'Free' },
                    { id: 'ai_forward', label: 'AI + Forward to Me', desc: 'AI texts back AND forwards to your personal number after 2 min', badge: 'Pro' },
                    { id: 'receptionist', label: 'Receptionist', desc: 'Live receptionist answers on your behalf', badge: 'Coming Soon' },
                  ].map(tier => (
                    <button key={tier.id} onClick={() => tier.id !== 'receptionist' && setCallTier(tier.id)}
                      style={{
                        padding: '24px 16px', textAlign: 'center', cursor: tier.id === 'receptionist' ? 'not-allowed' : 'pointer',
                        background: callTier === tier.id ? 'rgba(201,168,76,0.1)' : 'var(--dark-3)',
                        border: `1px solid ${callTier === tier.id ? 'var(--gold)' : 'var(--border-dim)'}`,
                        opacity: tier.id === 'receptionist' ? 0.5 : 1, transition: 'all .2s'
                      }}>
                      <div style={{ fontSize: 9, letterSpacing: '.2em', textTransform: 'uppercase', color: callTier === tier.id ? 'var(--gold)' : 'var(--muted)', marginBottom: 8 }}>{tier.badge}</div>
                      <div style={{ fontSize: 13, color: callTier === tier.id ? 'var(--gold)' : 'var(--text)', marginBottom: 6, fontWeight: 500 }}>{tier.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.5 }}>{tier.desc}</div>
                    </button>
                  ))}
                </div>
                {callTier === 'ai_forward' && (
                  <div style={{ marginBottom: 16 }}>
                    <FieldLabel>Your Personal Cell Number</FieldLabel>
                    <input className="input" placeholder="(555) 000-0000" value={personalPhone}
                      onChange={e => setPersonalPhone(e.target.value)} />
                  </div>
                )}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: 'var(--text)' }}>
                    <input type="checkbox" checked={missedCallTextBack}
                      onChange={e => setMissedCallTextBack(e.target.checked)} />
                    Text clients back automatically when they call and I don't answer
                  </label>
                </div>
                {missedCallTextBack && (
                  <div style={{ marginBottom: 16 }}>
                    <FieldLabel>Auto-Reply Message</FieldLabel>
                    <textarea className="input" rows={3} value={missedCallAutoText}
                      onChange={e => setMissedCallAutoText(e.target.value)}
                      style={{ resize: 'vertical' }} />
                    <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>Use {'{{booking_link}}'} for your booking page link, {'{{shop_name}}'} for your shop name.</div>
                  </div>
                )}
                {salon.twilio_phone_number && (
                  <div style={{ background: 'var(--dark-3)', border: '1px solid var(--border-dim)', padding: '14px 18px', marginBottom: 16 }}>
                    <div style={{ fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>Your Business Number</div>
                    <div style={{ fontSize: 16, color: 'var(--gold)' }}>{salon.twilio_phone_number}</div>
                  </div>
                )}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>Call Forwarding Instructions</div>
                  {[
                    ['iPhone', 'Settings \u2192 Phone \u2192 Call Forwarding \u2192 Toggle On \u2192 Enter business number'],
                    ['Android', 'Phone App \u2192 Menu \u2192 Settings \u2192 Call Forwarding \u2192 Always Forward'],
                    ['AT&T', 'Dial *21* then your business number then #'],
                    ['T-Mobile', 'Dial **21* then your business number then #'],
                    ['Verizon', 'Dial *72 then your business number'],
                  ].map(([device, steps]) => (
                    <div key={device} style={{ padding: '8px 14px', background: 'var(--dark-3)', border: '1px solid var(--border-dim)', marginBottom: 1, display: 'flex', gap: 12, fontSize: 11 }}>
                      <span style={{ color: 'var(--text)', fontWeight: 500, minWidth: 70 }}>{device}</span>
                      <span style={{ color: 'var(--muted)' }}>{steps}</span>
                    </div>
                  ))}
                </div>
                <button onClick={async () => {
                  setCallSettingsSaving(true)
                  try {
                    await sb().from('salons').update({
                      call_handling_tier: callTier,
                      personal_phone: personalPhone,
                      missed_call_text_back: missedCallTextBack,
                      missed_call_auto_text: missedCallAutoText
                    }).eq('id', salon.id)
                    setSalon(s => ({ ...s, call_handling_tier: callTier, personal_phone: personalPhone, missed_call_text_back: missedCallTextBack, missed_call_auto_text: missedCallAutoText }))
                    alert('Call settings saved!')
                  } catch { alert('Error saving.') }
                  setCallSettingsSaving(false)
                }} disabled={callSettingsSaving}
                  className="btn-gold" style={{ padding: '14px 32px', fontSize: 11, opacity: callSettingsSaving ? .5 : 1 }}>
                  {callSettingsSaving ? 'Saving...' : 'Save Call Settings'}
                </button>
              </div>

              {/* SMS Setup */}
              <div className="card-gold" style={{ padding: '36px', marginBottom: 20, position: 'relative' }}>
                <div className="gold-line-top" />
                <div className="eyebrow" style={{ marginBottom: 20 }}>Text Messages</div>
                {!salon.twilio_phone_number ? (
                  <>
                    <h3 className="cormorant" style={{ fontSize: 32, fontWeight: 300, marginBottom: 8 }}>
                      Enable <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Text Messages</em>
                    </h3>
                    <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.8, marginBottom: 28 }}>
                      Send appointment reminders, review requests, and marketing texts to your clients automatically. One tap and you're live.
                    </p>
                    <button onClick={enableTexting} disabled={provisioning}
                      className="btn-gold" style={{ padding: '14px 32px', fontSize: 11, opacity: provisioning ? .5 : 1 }}>
                      {provisioning ? 'Setting up...' : 'Enable Texting'}
                    </button>
                  </>
                ) : (
                  <>
                    <h3 className="cormorant" style={{ fontSize: 32, fontWeight: 300, marginBottom: 8 }}>
                      Texting is <em style={{ color: 'var(--green)', fontStyle: 'italic' }}>Active</em>
                    </h3>
                    <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.8, marginBottom: 8 }}>
                      Your clients receive texts from this number:
                    </p>
                    <div style={{ fontSize: 20, color: 'var(--gold)', fontWeight: 500, marginBottom: 28, letterSpacing: '.05em' }}>
                      {salon.twilio_phone_number}
                    </div>

                    {/* Test SMS */}
                    <div style={{ paddingTop: 20, borderTop: '1px solid var(--border-dim)' }}>
                      <FieldLabel>Send a Test Text</FieldLabel>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input className="input" placeholder="Your phone number" value={testPhone}
                          onChange={e => setTestPhone(e.target.value)} style={{ flex: 1 }} />
                        <button onClick={sendTestSms} disabled={testSending}
                          className="btn-gold" style={{ padding: '14px 24px', fontSize: 10, opacity: testSending ? .5 : 1, whiteSpace: 'nowrap' }}>
                          {testSending ? 'Sending...' : 'Send Test'}
                        </button>
                      </div>
                      {testResult && (
                        <div style={{ fontSize: 12, marginTop: 10, color: testResult.includes('Sent') ? 'var(--green)' : 'var(--red)' }}>
                          {testResult}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* SMS Log */}
              {smsLog.length > 0 && (
                <div className="card" style={{ padding: '28px', marginBottom: 20 }}>
                  <div className="cinzel" style={{ fontSize: 10, letterSpacing: '.2em', color: 'var(--gold)', marginBottom: 16 }}>Recent SMS Activity</div>
                  <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                    {smsLog.slice(0, 20).map(s => (
                      <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderBottom: '1px solid var(--border-dim)' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.status === 'sent' ? 'var(--green)' : 'var(--red)', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, color: 'var(--text)', marginBottom: 2 }}>{s.to_phone}</div>
                          <div style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.message}</div>
                        </div>
                        <div style={{ fontSize: 10, color: s.status === 'sent' ? 'var(--green)' : 'var(--red)', flexShrink: 0, textTransform: 'uppercase', letterSpacing: '.1em' }}>{s.status}</div>
                        <div style={{ fontSize: 10, color: 'var(--muted)', flexShrink: 0 }}>{timeAgo(s.created_at)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="card" style={{ padding: '28px' }}>
                <div className="cinzel" style={{ fontSize: 10, letterSpacing: '.2em', color: 'var(--gold)', marginBottom: 16 }}>What Fires Automatically</div>
                {[
                  ['New booking', 'You get a text the moment someone books through your page'],
                  ['24hr reminder', 'Client gets an automatic reminder the day before'],
                  ['1hr reminder', 'Client gets a reminder 1 hour before their appointment'],
                  ['After visit', 'Review request goes out automatically after each appointment'],
                  ['45 days quiet', 'Win-back text goes to any client who hasn\'t returned'],
                  ['Birthday', 'Special offer goes out on the client\'s birthday'],
                ].map(([title, desc], i) => (
                  <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 16, alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--gold)', fontSize: 10, marginTop: 4, flexShrink: 0 }}>â¦</span>
                    <div>
                      <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 2 }}>{title}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

