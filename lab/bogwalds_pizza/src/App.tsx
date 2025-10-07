import { useState, type ChangeEvent, type FormEvent } from 'react';
import {
  Card,
  Paragraph,
  Textfield,
  Tabs,
  Button,
} from '@digdir/designsystemet-react';

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [formData, setFormData] = useState({
    name: '',
    table: '',
    orderNumber: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const pizzas = [
    { name: 'Pasta Bolognese', desc: 'Classic tomato sauce, mozzarella, and fresh basil.', price: '149 kr' },
    { name: 'Pasta Bolognese without bacon', desc: 'Spicy pepperoni with mozzarella and tomato sauce.', price: '169 kr' },
    { name: 'Pasta Bolognese without pasta', desc: 'Grilled vegetables, olives, and mozzarella.', price: '159 kr' },
  ];

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleChange =
    (field: string) => (e: ChangeEvent<HTMLInputElement>) => {
      setFormData({ ...formData, [field]: e.target.value });
    };

  return (
    <div
      style={{
        maxWidth: '700px',
        margin: '2rem auto',
        padding: '1rem',
      }}
    >
      <Paragraph data-size='xl'>
        Velkommen til Bogwalds pizza
      </Paragraph>

      <Tabs
        value={activeTab}
        onChange={(value) => {
          setActiveTab(value);
          setSubmitted(false);
        }}
      >
        <Tabs.List>
          <Tabs.Tab value="home">Home</Tabs.Tab>
          <Tabs.Tab value="menu">Menu</Tabs.Tab>
          <Tabs.Tab value="order">Order</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="home">
          <Card>
            <div data-size="medium">
              Welcome to Bogwalds pizza
            </div>
            <Paragraph>
              Enjoy our delicious, hand-crafted pasta bolognese made with fresh ingredients and baked in a traditional stone oven.
            </Paragraph>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="menu">
          {pizzas.map((pizza, i) => (
            <Card key={i} style={{ marginBottom: '1rem' }}>
              <Paragraph>{pizza.name}</Paragraph>
              <Paragraph>{pizza.desc}</Paragraph>
              <Paragraph><strong>{pizza.price}</strong></Paragraph>
            </Card>
          ))}
        </Tabs.Panel>

        <Tabs.Panel value="order">
          {!submitted ? (
            <Card>
              <Paragraph>Place your order</Paragraph>
              <form
                onSubmit={handleSubmit}
                style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
              >
                <Textfield
                  label="Name"
                  value={formData.name}
                  onChange={handleChange('name')}
                  required
                />
                <Textfield
                  label="Table number"
                  type="number"
                  value={formData.table}
                  onChange={handleChange('table')}
                  required
                />
                <Textfield
                  label="Order number"
                  type="number"
                  value={formData.orderNumber}
                  onChange={handleChange('orderNumber')}
                  required
                />
                <Button type="submit" variant="primary">
                  Submit order
                </Button>
              </form>
            </Card>
          ) : (
            <Card>
              <Paragraph>
                Thank you, {formData.name}!
              </Paragraph>
              <Paragraph>
                Your order (#{formData.orderNumber}) from table {formData.table} has been received.
              </Paragraph>
              <Button onClick={() => setSubmitted(false)}>Place another</Button>
            </Card>
          )}
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}

export default App;
