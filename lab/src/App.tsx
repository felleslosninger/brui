import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Card,
  Fieldset,
  Heading,
  Label,
  Paragraph,
  Select,
  Textarea,
  Textfield,
  Button,
  Tag,
  ToggleGroup,
  Alert,
} from '@digdir/designsystemet-react';
import searchIndex from '@ksvedal/docs/search-index';
import { Sidebar } from '@brui/ui';
import {
  clampSidebarWidth,
  createPlaygroundConfig,
  createPlaygroundFunctions,
  emptyForm,
  MAX_SIDEBAR_WIDTH,
  MIN_SIDEBAR_WIDTH,
  type ColorMode,
  type FormState,
  type Language,
} from './config';

const labels: Record<Language, Record<string, string>> = {
  nb: {
    colorMode: 'Fargemodus',
    language: 'Språk',
    sidebarWidth: 'Sidebar-bredde',
    preview: 'Forhåndsvisning',
    home: 'Hjem',
    contact: 'Kontakt',
    about: 'Om oss',
    welcomeTitle: 'Velkommen',
    welcomeText: 'Dette er en demo-side. Bruk sidebaren til å stille spørsmål eller utføre handlinger.',
    contactTitle: 'Kontaktskjema',
    aboutTitle: 'Om oss',
    aboutText: 'Dette er en eksempel-side for å teste Brui sidebar-komponenten.',
    name: 'Navn',
    email: 'E-post',
    phone: 'Telefon',
    subject: 'Emne',
    message: 'Melding',
    submit: 'Send inn',
    clear: 'Tøm',
    submitted: 'Skjemaet er sendt!',
    selectSubject: 'Velg emne...',
  },
  en: {
    colorMode: 'Color mode',
    language: 'Language',
    sidebarWidth: 'Sidebar width',
    preview: 'Preview',
    home: 'Home',
    contact: 'Contact',
    about: 'About',
    welcomeTitle: 'Welcome',
    welcomeText: 'This is a demo site. Use the sidebar to ask questions or perform actions.',
    contactTitle: 'Contact form',
    aboutTitle: 'About us',
    aboutText: 'This is a sample page for testing the Brui sidebar component.',
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    subject: 'Subject',
    message: 'Message',
    submit: 'Submit',
    clear: 'Clear',
    submitted: 'Form submitted!',
    selectSubject: 'Select subject...',
  },
};

export function PlaygroundApp() {
  const [colorMode, setColorMode] = useState<ColorMode>('light');
  const [lang, setLang] = useState<Language>('nb');
  const [sidebarWidth, setSidebarWidth] = useState(380);
  const [tab, setTab] = useState('home');
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitted, setSubmitted] = useState(false);
  const [counter, setCounter] = useState(0);
  const [silenceThreshold, setSilenceThreshold] = useState(0.04);
  const [silenceAutoFlushMs, setSilenceAutoFlushMs] = useState(900);

  const isResizing = useRef(false);

  const baseConfig = useMemo(() => createPlaygroundConfig(), []);
  const config = useMemo(
    () => ({
      ...baseConfig,
      transcribe: baseConfig.transcribe
        ? { ...baseConfig.transcribe, silenceThreshold, silenceAutoFlushMs }
        : undefined,
    }),
    [baseConfig, silenceThreshold, silenceAutoFlushMs],
  );
  const functions = useMemo(
    () => createPlaygroundFunctions(
      setForm,
      setTab,
      setSubmitted,
      setCounter,
      setSidebarWidth,
      setColorMode,
      setLang,
    ),
    [],
  );

  const t = labels[lang];

  useEffect(() => {
    document.documentElement.setAttribute('data-color-scheme', colorMode);
  }, [colorMode]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const newWidth = window.innerWidth - e.clientX;
      setSidebarWidth(clampSidebarWidth(newWidth));
    };
    const onMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  function startResize() {
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }

  return (
    <div className="pg-root" data-color-scheme={colorMode}>
      {/* ─── Controls panel ─── */}
      <aside className="pg-controls">
        
            <Heading level={2} data-size="xs">Brui Playground</Heading>

            <Fieldset className="pg-fieldset">
              <div className="pg-toggle-row">
                <Paragraph data-size="sm">{t.colorMode}</Paragraph>
                <ToggleGroup
                  variant="secondary"
                  data-size="sm"
                  value={colorMode}
                  onChange={(v) => setColorMode(v as ColorMode)}
                >
                  <ToggleGroup.Item value="light">Light</ToggleGroup.Item>
                  <ToggleGroup.Item value="dark">Dark</ToggleGroup.Item>
                </ToggleGroup>
              </div>

              <div className="pg-toggle-row">
                <Paragraph data-size="sm">{t.language}</Paragraph>
                <ToggleGroup
                  variant="secondary"
                  data-size="sm"
                  value={lang}
                  onChange={(v) => setLang(v as Language)}
                >
                  <ToggleGroup.Item value="nb">Norsk</ToggleGroup.Item>
                  <ToggleGroup.Item value="en">English</ToggleGroup.Item>
                </ToggleGroup>
              </div>

              <div className="pg-toggle-row">
                <Paragraph data-size="sm">{t.sidebarWidth}: {sidebarWidth}px</Paragraph>
                <input
                  type="range"
                  min={MIN_SIDEBAR_WIDTH}
                  max={MAX_SIDEBAR_WIDTH}
                  value={sidebarWidth}
                  onChange={(e) => setSidebarWidth(clampSidebarWidth(Number(e.target.value)))}
                  className="pg-range"
                  aria-label={t.sidebarWidth}
                />
              </div>
            </Fieldset>

            <Heading level={3} data-size="2xs">Transcribe</Heading>
            <Fieldset className="pg-fieldset">
              <div className="pg-toggle-row">
                <Paragraph data-size="sm">
                  Mic threshold: {silenceThreshold.toFixed(3)}
                </Paragraph>
                <input
                  type="range"
                  min={0.005}
                  max={0.15}
                  step={0.005}
                  value={silenceThreshold}
                  onChange={(e) => setSilenceThreshold(Number(e.target.value))}
                  className="pg-range"
                  aria-label="Mic silence threshold"
                />
              </div>

              <div className="pg-toggle-row">
                <Paragraph data-size="sm">
                  Silence flush: {silenceAutoFlushMs} ms
                </Paragraph>
                <input
                  type="range"
                  min={200}
                  max={2000}
                  step={50}
                  value={silenceAutoFlushMs}
                  onChange={(e) => setSilenceAutoFlushMs(Number(e.target.value))}
                  className="pg-range"
                  aria-label="Silence auto-flush duration"
                />
              </div>
            </Fieldset>

            <div className="pg-meta">
              <Tag data-color={colorMode === 'dark' ? 'neutral' : 'info'} data-size="sm">
                {colorMode}
              </Tag>
              <Tag data-color="neutral" data-size="sm">{lang}</Tag>
              <Tag data-color="neutral" data-size="sm">{sidebarWidth}px</Tag>
              <Tag data-color="success" data-size="sm">Counter: {counter}</Tag>
            </div>
      </aside>

      {/* ─── Main content area ─── */}
      <main className="pg-main">
        {/* Tab bar */}
        <nav className="pg-tabs">
          <ToggleGroup
            variant="secondary"
            value={tab}
            onChange={setTab}
          >
            <ToggleGroup.Item value="home">{t.home}</ToggleGroup.Item>
            <ToggleGroup.Item value="contact">{t.contact}</ToggleGroup.Item>
            <ToggleGroup.Item value="about">{t.about}</ToggleGroup.Item>
          </ToggleGroup>
        </nav>

        <div className="pg-page">
          {tab === 'home' && (
            <Card>
              <Card.Block>
                <Heading level={2}>{t.welcomeTitle}</Heading>
                <Paragraph>{t.welcomeText}</Paragraph>
              </Card.Block>
            </Card>
          )}

          {tab === 'contact' && (
            <>
                <Heading level={2}>{t.contactTitle}</Heading>

                {submitted && (
                  <Alert data-color="success" className="pg-alert">
                    {t.submitted}
                  </Alert>
                )}

                <Fieldset className="pg-form">
                  <Textfield
                    label={t.name}
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                  <Textfield
                    label={t.email}
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  />
                  <Textfield
                    label={t.phone}
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  />
                  <div>
                    <Label htmlFor="subject-select">{t.subject}</Label>
                    <Select
                      id="subject-select"
                      value={form.subject}
                      onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                    >
                      <Select.Option value="">{t.selectSubject}</Select.Option>
                      <Select.Option value="General">General</Select.Option>
                      <Select.Option value="Support">Support</Select.Option>
                      <Select.Option value="Sales">Sales</Select.Option>
                      <Select.Option value="Feedback">Feedback</Select.Option>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="message-textarea">{t.message}</Label>
                    <Textarea
                      id="message-textarea"
                      value={form.message}
                      onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                      rows={4}
                    />
                  </div>
                  <div className="pg-form-actions">
                    <Button
                      onClick={() => setSubmitted(true)}
                    >
                      {t.submit}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setForm(emptyForm);
                        setSubmitted(false);
                      }}
                    >
                      {t.clear}
                    </Button>
                  </div>
                </Fieldset></>
          )}

          {tab === 'about' && (
            <Card>
              <Card.Block>
                <Heading level={2}>{t.aboutTitle}</Heading>
                <Paragraph>{t.aboutText}</Paragraph>
              </Card.Block>
            </Card>
          )}
        </div>
      </main>

      {/* ─── Resize handle ─── */}
      <div className="pg-resize-handle" onMouseDown={startResize} />

      {/* ─── Sidebar ─── */}
      <aside className="pg-sidebar" style={{ width: sidebarWidth }}>
        <Sidebar config={config} functions={functions} includePageContext />
      </aside>
    </div>
  );
}
