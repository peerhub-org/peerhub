import { Tab, Tabs } from '@mui/material'
import { ChatBubbleOutline, Check, Rule, Visibility } from '@mui/icons-material'
import { TabsRow, TabBadge, TabLabelWrapper } from './ProfileContent.styled'

type FilterTab = 'all' | 'approve' | 'comment' | 'request_change'

const TABS: { value: FilterTab; label: string; icon: React.ReactElement }[] = [
  { value: 'all', label: 'All reviews', icon: <Visibility sx={{ fontSize: 16 }} /> },
  { value: 'approve', label: 'Approvals', icon: <Check sx={{ fontSize: 16 }} /> },
  { value: 'request_change', label: 'Change requests', icon: <Rule sx={{ fontSize: 16 }} /> },
  { value: 'comment', label: 'Comments', icon: <ChatBubbleOutline sx={{ fontSize: 16 }} /> },
]

interface ProfileTabsProps {
  activeTab: FilterTab
  onTabChange: (_: unknown, newValue: FilterTab) => void
  tabCounts: Record<FilterTab, number>
  isClosed: boolean
  isDraftLocked?: boolean
  isGuest?: boolean
}

export default function ProfileTabs({
  activeTab,
  onTabChange,
  tabCounts,
  isClosed,
  isDraftLocked = false,
  isGuest = false,
}: ProfileTabsProps) {
  return (
    <TabsRow>
      <Tabs value={activeTab} onChange={onTabChange} variant='scrollable' scrollButtons='auto'>
        {TABS.map((tab) => (
          <Tab
            key={tab.value}
            value={tab.value}
            icon={tab.icon}
            iconPosition='start'
            disabled={isClosed || isDraftLocked || isGuest}
            label={
              <TabLabelWrapper>
                {tab.label}
                {!isClosed && (
                  <>
                    &nbsp;
                    <TabBadge
                      badgeContent={isDraftLocked || isGuest ? '?' : String(tabCounts[tab.value])}
                    />
                  </>
                )}
              </TabLabelWrapper>
            }
          />
        ))}
      </Tabs>
    </TabsRow>
  )
}
