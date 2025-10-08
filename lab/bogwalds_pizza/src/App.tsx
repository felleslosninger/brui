import { useState, type ChangeEvent, type FormEvent, type SetStateAction } from 'react';
import {
  Card,
  Paragraph,
  Textfield,
  Tabs,
  Button,
} from '@digdir/designsystemet-react';
import Sidebar from "@brui/ui/src/components/Sidebar.tsx";
import { Setup, type FunctionRegistry, type Configuration } from "../../../client/core"
import configData from "./config.json";

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

  const addPizzaToOrder = (args: Record<string, unknown>) => {
    const { pizzaName } = args;
    console.log('Adding pizza to order:', pizzaName);
    return { success: true, pizzaName };
  };

  const changetab = (args: SetStateAction<string>) => {
    console.log (args)
    setActiveTab(args.value)
  };

  const functions: FunctionRegistry = {
    addPizzaToOrder,
    changetab
  };

    function handleSubmitChatMessage(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);

        const inputText = formData.get('chatMessage');
        const dropdownValue = formData.get('contextChoice');

      Setup(configData as Configuration, functions).then(eventTarget => {
        const chatInputEvent = new CustomEvent('chat:input', {
          detail: {
            query: inputText,
            metadata: { test: true },
          },
        });
        eventTarget.dispatchEvent(chatInputEvent);
      });
    }

    return (
    <div>
      <div className="w-96 h-full bg-red-200 absolute right-0 top-0 z-10">
        <Sidebar handleSubmit={handleSubmitChatMessage}/>
      </div>
      <div className="pr-96">
        <Paragraph data-size='xl' className='pt-6 px-6 bg-white'>
          Velkommen til Bogwalds pizza
        </Paragraph>

        <Tabs
            className="z-0"
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
                  <div className='flex justify-between items-center'>
                    <div className='flex-1'>
                      <Paragraph>{pizza.name}</Paragraph>
                      <Paragraph>{pizza.desc}</Paragraph>
                      <Paragraph><strong>{pizza.price}</strong></Paragraph>
                    </div>
                    <Button
                      onClick={() => {
                        console.log('Button clicked!', pizza.name);
                        addPizzaToOrder({ pizzaName: pizza.name });
                      }}
                      variant="primary"
                      data-size="sm"
                    >
                      Add
                    </Button>
                  </div>
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
    </div>
    
  );
}

export default App;