import { useState } from "react";
import { Card, List, Badge, Typography, Button } from "antd";
import {
  ClockCircleOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  PlusOutlined,
  TeamOutlined,
  DownOutlined,
  UpOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { ShoppingSnapshot } from "../shopping";
import CalendarEventForm from "./CalendarEventForm";

// Enable timezone plugins
dayjs.extend(utc);
dayjs.extend(timezone);

// Set default timezone to Europe/London (handles BST/GMT automatically)
dayjs.tz.setDefault("Europe/London");

const { Title, Text } = Typography;

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  start_time: string;
  end_time?: string;
  all_day: boolean;
  color?: string;
  user?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

interface CalendarMobileProps {
  events: CalendarEvent[];
  onRefresh?: () => void;
  onNavigateToCalendar?: () => void;
}

export default function CalendarMobile({
  events,
  onRefresh,
  onNavigateToCalendar,
}: CalendarMobileProps) {
  const [formVisible, setFormVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showAllToday, setShowAllToday] = useState(false);
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const navigate = useNavigate();
  // Parse UTC time and convert to local timezone
  const parseEventTime = (utcTimeString: string) => {
    return dayjs.utc(utcTimeString).tz("Europe/London");
  };

  // Group events by date
  const today = dayjs().startOf("day");
  const todayEvents = events.filter((e) =>
    parseEventTime(e.start_time).isSame(today, "day"),
  );

  // Limit displayed today events to 3 unless expanded
  const displayedTodayEvents = showAllToday
    ? todayEvents
    : todayEvents.slice(0, 3);

  const upcomingEvents = events
    .filter((e) => parseEventTime(e.start_time).isAfter(today, "day"))
    .sort((a, b) => dayjs(a.start_time).unix() - dayjs(b.start_time).unix())
    .slice(0, 10);

  // Limit displayed upcoming events to 3 unless expanded
  const displayedUpcomingEvents = showAllUpcoming
    ? upcomingEvents
    : upcomingEvents.slice(0, 3);

  const formatTime = (utcTimeString: string) =>
    parseEventTime(utcTimeString).format("h:mm A");
  const formatDate = (utcTimeString: string) =>
    parseEventTime(utcTimeString).format("ddd, MMM D");

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setFormVisible(true);
  };

  return (
    <div
      style={{
        background: "#fef7f0",
        minHeight: "100vh",
        padding: "16px",
        paddingBottom: "80px",
      }}
    >
      {/* Weather Widget */}
      <Card
        style={{
          marginBottom: 16,
          borderRadius: 12,
          background: "linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)",
          border: "none",
          color: "white",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <Text style={{ color: "white", fontSize: 14 }}>
              {dayjs().format("dddd, MMMM D, YYYY")}
            </Text>
            <Title level={2} style={{ margin: "8px 0 0 0", color: "white" }}>
              {dayjs().format("h:mm A")}
            </Title>
          </div>
          <div style={{ textAlign: "right" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="5" fill="#FFD93D"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="#FFD93D" strokeWidth="2" strokeLinecap="round"/></svg>
            <div style={{ fontSize: 24, fontWeight: 600 }}>18°C</div>
            <div style={{ fontSize: 12, opacity: 0.9 }}>Sunny</div>
          </div>
        </div>
      </Card>

      {/* Today's Schedule */}
      <Card
        title={
          <Title level={4} style={{ margin: 0 }}>
            Today's Schedule
          </Title>
        }
        style={{ marginBottom: 16, borderRadius: 12, border: "none" }}
      >
        {todayEvents.length === 0 ? (
          <div
            style={{ textAlign: "center", padding: "20px 0", color: "#64748b" }}
          >
            No events scheduled for today
          </div>
        ) : (
          <>
            <List
              dataSource={displayedTodayEvents}
              renderItem={(event) => (
              <List.Item
                onClick={() => handleEventClick(event)}
                style={{
                  padding: "12px 0",
                  borderLeft: `4px solid ${event.color || "#2dd4bf"}`,
                  paddingLeft: 12,
                  marginBottom: 8,
                  background: "#fef7f0",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}
                  >
                    {event.title}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      color: "#64748b",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <ClockCircleOutlined />
                    {event.all_day ? "All Day" : formatTime(event.start_time)}
                    {event.location && (
                      <>
                        <EnvironmentOutlined />
                        {event.location}
                      </>
                    )}
                  </div>
                </div>
              </List.Item>
            )}
            />
            {todayEvents.length > 3 && (
              <div
                onClick={() => setShowAllToday(!showAllToday)}
                style={{
                  textAlign: "center",
                  padding: "12px 0",
                  color: "#2dd4bf",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {showAllToday ? (
                  <>
                    <UpOutlined /> Show Less
                  </>
                ) : (
                  <>
                    <DownOutlined /> Show {todayEvents.length - 3} More
                  </>
                )}
              </div>
            )}
          </>
        )}
      </Card>

      {/* Coming Up */}
      <Card
        title={
          <Title level={4} style={{ margin: 0 }}>
            Coming Up
          </Title>
        }
        style={{ marginBottom: 16, borderRadius: 12, border: "none" }}
      >
        {upcomingEvents.length === 0 ? (
          <div
            style={{ textAlign: "center", padding: "20px 0", color: "#64748b" }}
          >
            No upcoming events
          </div>
        ) : (
          <>
            <List
              dataSource={displayedUpcomingEvents}
              renderItem={(event) => (
                <List.Item
                  onClick={() => handleEventClick(event)}
                  style={{
                    padding: "12px 0",
                    borderLeft: `4px solid ${event.color || "#2dd4bf"}`,
                    paddingLeft: 12,
                    marginBottom: 8,
                    background: "#fef7f0",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}
                    >
                      {event.title}
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        color: "#64748b",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <ClockCircleOutlined />
                      {formatDate(event.start_time)}
                      {!event.all_day && ` • ${formatTime(event.start_time)}`}
                      {event.location && (
                        <>
                          <EnvironmentOutlined />
                          {event.location}
                        </>
                      )}
                    </div>
                  </div>
                </List.Item>
              )}
            />
            {upcomingEvents.length > 3 && (
              <div
                onClick={() => setShowAllUpcoming(!showAllUpcoming)}
                style={{
                  textAlign: "center",
                  padding: "12px 0",
                  color: "#2dd4bf",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {showAllUpcoming ? (
                  <>
                    <UpOutlined /> Show Less
                  </>
                ) : (
                  <>
                    <DownOutlined /> Show {upcomingEvents.length - 3} More
                  </>
                )}
              </div>
            )}
          </>
        )}
      </Card>

      {/* Shopping List */}
      <div style={{ marginBottom: 16 }}>
        <ShoppingSnapshot />
      </div>

      {/* Quick Actions */}
      <Card
        title={
          <Title level={4} style={{ margin: 0 }}>
            Quick Actions
          </Title>
        }
        style={{ marginBottom: 16, borderRadius: 12, border: "none" }}
      >
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          <Button
            size="large"
            onClick={() => setFormVisible(true)}
            style={{
              height: 80,
              background: "#f0fdfa",
              border: "none",
              borderRadius: 16,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              fontWeight: 600,
            }}
          >
            <PlusOutlined style={{ fontSize: 28, color: '#2dd4bf' }} />
            <span style={{ fontSize: 13 }}>Add Event</span>
          </Button>

          <Button
            size="large"
            onClick={onNavigateToCalendar}
            style={{
              height: 80,
              background: "#f0fdfa",
              border: "none",
              borderRadius: 16,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              fontWeight: 600,
            }}
          >
            <CalendarOutlined style={{ fontSize: 28, color: '#2dd4bf' }} />
            <span style={{ fontSize: 13 }}>Full Calendar</span>
          </Button>
          <Button
            size="large"
            onClick={() => navigate("/contacts")}
            style={{
              height: 80,
              background: "#f0fdfa",
              border: "none",
              borderRadius: 16,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              fontWeight: 600,
            }}
          >
            <TeamOutlined style={{ fontSize: 28, color: '#2dd4bf' }} />
            <span style={{ fontSize: 13 }}>Contacts</span>
          </Button>
        </div>
      </Card>

      {/* Event Form Modal */}
      <CalendarEventForm
        mode={selectedEvent ? "edit" : "create"}
        event={selectedEvent || undefined}
        visible={formVisible}
        onClose={() => {
          setFormVisible(false);
          setSelectedEvent(null);
        }}
        onSuccess={() => {
          setFormVisible(false);
          setSelectedEvent(null);
          if (onRefresh) onRefresh();
        }}
      />
    </div>
  );
}
