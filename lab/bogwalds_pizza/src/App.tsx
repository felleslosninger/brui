import { type ChangeEvent, type FormEvent, useState } from 'react';
import { Button, Card, Heading, Paragraph, Tabs, Textfield, } from '@digdir/designsystemet-react';
import Sidebar from "@brui/ui/src/components/Sidebar.tsx";
import * as Brui from "../../../client/index"
import configData from "./config.json";
import { ShoppingBasketIcon } from "@navikt/aksel-icons";

type Theme = "digdir" | "party";

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
  const [theme, setTheme] = useState<Theme>("digdir");
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

    const handleSubmit = (e?: FormEvent<HTMLFormElement>) => {
        if (e) e.preventDefault();
        submitOrder();
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

    const submitOrder = () => {
        setSubmitted(true);
        setSubmittedItems(prev => [...prev, formData]);
        setFormData({ name: "", table: "", orderNumber: "" });
    };

    const fillFields = (args: { name?: string; table?: string; orderNumber?: string }) => {
        setFormData(prev => ({
            ...prev,
            name: args.name ?? prev.name,
            table: args.table ?? prev.table,
            orderNumber: args.orderNumber ?? prev.orderNumber,
        }));

        setSubmitted(false);

        console.log("Submitted order")
        submitOrder()
    };

  const handleSetActiveTab = (args: { value: string}) => {
      setActiveTab(args.value)
  }

  const functions: Brui.FunctionRegistry = {
    addPizzaToOrder,
    fillFields,
    handleSetActiveTab,
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
    <div className='grid grid-cols-12 h-screen' data-theme={theme}>
      <div className="col-span-8">
          <div className="flex flex-row justify-between items-center m-auto px-6 py-6">
              <Paragraph data-size="xl">
                  Velkommen til Bøgwalds pizza
              </Paragraph>

              <Button onClick={() => setTheme(theme === "digdir" ? "party" : "digdir")}>
                  {theme === "party" ? (
                      <>D</>
                  ) : (
                      <>🍕</>
                  )}
              </Button>
          </div>

        <Tabs
            className="z-0"
            value={activeTab}
            onChange={(value) => {
              setActiveTab(value);
              setSubmitted(false);
            }}
        >
          <Tabs.List className='px-20'>
            <Tabs.Tab value="home">Home</Tabs.Tab>
            <Tabs.Tab value="menu">Menu</Tabs.Tab>
            <Tabs.Tab value="order">Order</Tabs.Tab>
            <Tabs.Tab value="cart" className="ml-auto">
                <>
                    {submittedItems.length > 0 && <div>{submittedItems.length}</div>}
                    <ShoppingBasketIcon />
                </>
            </Tabs.Tab>
          </Tabs.List>

            <Tabs.Panel value="home" className="mx-20">
                <Card className="pizza-bg breathing-element card bg-transparent border-0">

                    <Heading className="pizza-title">
                        Bøgwald's Pizza: A Trip for Your Tastebuds
                    </Heading>

                    <Paragraph className="pizza-subtitle">
                        Descend into a delicious dimension of mind-bending pizza creations.
                        Each slice is a portal to a new reality of flavor.
                        Are you ready to explore?
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