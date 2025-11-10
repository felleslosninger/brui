import { type ChangeEvent, type FormEvent, useState } from 'react';
import { Button, Card, Paragraph, Tabs, Textfield, } from '@digdir/designsystemet-react';
import Sidebar from "@brui/ui/src/components/Sidebar.tsx";
import * as Brui from "../../../client/index"
import configData from "./config.json";
import { ShoppingBasketIcon } from "@navikt/aksel-icons";

type UserInput = {
  textInput: string;
  contextChoice: string;
};

interface FormEntry {
    name: string;
    table: string;
    orderNumber: string;
}


function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [formData, setFormData] = useState<FormEntry>({
    name: '',
    table: '',
    orderNumber: '',
  });

  const [submittedItems, setSubmittedItems] = useState<FormEntry[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const pizzas = [
    { name: '1. Pasta Bolognese', desc: 'Classic tomato sauce, mozzarella, and fresh basil.', price: '149 kr' },
    { name: '2. Pasta Bolognese without bacon', desc: 'Spicy pepperoni with mozzarella and tomato sauce.', price: '169 kr' },
    { name: '3. Pasta Bolognese without pasta', desc: 'Grilled vegetables, olives, and mozzarella.', price: '159 kr' },
  ];

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitted(true);

        setSubmittedItems((prevItems) => [...prevItems, formData]);
        setFormData({ name: "", table: "", orderNumber: "" });
    };

  const handleChange =
    (field: string) => (e: ChangeEvent<HTMLInputElement>) => {
      setFormData({ ...formData, [field]: e.target.value });
    };

  function addPizzaToOrder(args: Record<string, unknown>) {
    const pizzaName = args.pizzaName;
    console.log('Adding pizza to order:', pizzaName);
    return { success: true, pizzaName };
  }

    const fillFields = (args: { name?: string; table?: string; orderNumber?: string }) => {
        setFormData(prev => ({
            ...prev,
            name: args.name ?? prev.name,
            table: args.table ?? prev.table,
            orderNumber: args.orderNumber ?? prev.orderNumber,
        }));

        setSubmitted(false);

        console.log("Submitted order")
    };

  const handleSetActiveTab = (args: { value: string}) => {
      setActiveTab(args.value)
  }

  const functions: Brui.FunctionRegistry = {
    addPizzaToOrder,
    fillFields,
    handleSetActiveTab
  };

  const processMessage = Brui.Setup(
    configData as Brui.Configuration,
    functions
  );

    const inputHandler = async (userInput: UserInput): Promise<{
        success: boolean;
        executionResults?: any[];
        error?: string;
    }> => {
        try {
            return await processMessage(userInput.textInput);
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    };

  return (
    <div className='grid grid-cols-12 h-screen'>
      <div className="col-span-8">
        <Paragraph data-size='xl' className='pt-6 px-6 bg-white'>
          Velkommen til Bøgwalds pizza
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
              <Tabs.Tab value="cart" className="ml-auto"><ShoppingBasketIcon /></Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="home" className='mx-20'>
            <Card className='bg-white border-none shadow'>
              <div data-size="medium">
                Welcome to Bægwalds pizza
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

            <Tabs.Panel value="cart" className="mx-20">
                <Card className="bg-white border-none shadow p-4">
                    {submittedItems.length === 0 ? (
                        <>
                            <div data-size="medium">Your cart is empty</div>
                            <Paragraph>
                                Add some orders using the form to see them listed here.
                            </Paragraph>
                        </>
                    ) : (
                        <>
                            <div data-size="medium" className="mb-2">
                                Submitted Orders
                            </div>
                            <ul className="list-disc list-inside space-y-2">
                                {submittedItems.map((item, index) => (
                                    <li key={index}>
                                        <strong>{item.name}</strong> — Table {item.table} — Order #
                                        {item.orderNumber}
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </Card>
            </Tabs.Panel>
        </Tabs>
      </div>
      <div className="col-span-4 shadow-lg">
        <Sidebar inputHandler={inputHandler}/>
      </div>
    </div>
    
  );
}

export default App;