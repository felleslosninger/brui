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
    <div>
      <Paragraph data-size='xl' className='pt-6 px-6 bg-white'>
        Velkommen til Bogwalds pizza
      </Paragraph>

      <Tabs
        value={activeTab}
        onChange={(value) => {
          setActiveTab(value);
          setSubmitted(false);
        }}
      >
        <Tabs.List className='bg-white px-20'>
          <Tabs.Tab value="home">Home</Tabs.Tab>
          <Tabs.Tab value="menu">Menu</Tabs.Tab>
          <Tabs.Tab value="order">Order</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="home" className='mx-20'>
          <Card className='bg-white border-none shadow'>
            <div data-size="medium">
              Welcome to Bogwalds pizza
            </div>
            <Paragraph>
              Enjoy our delicious, hand-crafted pasta bolognese made with fresh ingredients and baked in a traditional stone oven.
            </Paragraph>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="menu" className='mx-20'>
          {pizzas.map((pizza, i) => (
            <Card key={i} className='bg-white border-none shadow mb-2'>
              <Paragraph>{pizza.name}</Paragraph>
              <Paragraph>{pizza.desc}</Paragraph>
              <Paragraph><strong>{pizza.price}</strong></Paragraph>
            </Card>
          ))}
        </Tabs.Panel>

        <Tabs.Panel value="order" className='mx-20'>
          {!submitted ? (
            <Card className='bg-white shadow border-none'>
              <Paragraph>Place your order</Paragraph>
              <form
                onSubmit={handleSubmit}
                className='space-y-6'
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
            <Card className='shadow border-none bg-white'>
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
