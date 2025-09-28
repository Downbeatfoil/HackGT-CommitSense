import { useState } from "react";
import { Card } from "@/components/ui/card";

interface CodeLine {
  number: number;
  content: string;
  explanation?: {
    what: string;
    why: string;
    source: string;
  };
}

interface CodeViewerProps {
  onLineSelect: (line: CodeLine) => void;
}

const sampleCode: CodeLine[] = [
  {
    number: 1,
    content: "import snowflake.connector",
    explanation: {
      what: "Imports the official Snowflake Python connector for database connectivity. This module provides secure, authenticated connections to Snowflake data warehouses with built-in connection pooling and SSL encryption.",
      why: "Eric Martinez added this import to establish a dedicated connection for retrieving code metadata and commit history from our centralized Snowflake analytics database. The previous SQLite solution couldn't handle the increasing data volume from multiple repositories.",
      source: "Added by Eric Martinez in commit abc123ef for ticket INFRA-89. This was part of the infrastructure modernization initiative to move from local databases to cloud-based analytics storage."
    }
  },
  {
    number: 2,
    content: "from retry import retry",
    explanation: {
      what: "Imports the retry decorator library that provides automatic retry functionality with configurable backoff strategies. This decorator can be applied to functions that may fail due to transient issues.",
      why: "Sarah Chen identified that network-related failures were causing intermittent issues in production. She researched various retry libraries and chose this one for its clean API and exponential backoff support.",
      source: "Added by Sarah Chen in commit bcd234fg for ticket INFRA-92. Sarah chose this library over alternatives like tenacity because of its simpler configuration syntax."
    }
  },
  {
    number: 3,
    content: "from typing import Dict, List, Optional",
    explanation: {
      what: "Imports Python type hints for better code documentation and IDE support. Dict represents dictionary types, List for arrays, and Optional for nullable values.",
      why: "Michael Rodriguez introduced comprehensive type hints as part of the code quality improvement initiative. This helps prevent runtime type errors and makes the codebase more maintainable for new team members.",
      source: "Added by Michael Rodriguez in commit cde345gh for ticket QUALITY-15. Michael was following the team's new coding standards established in Q3 2023."
    }
  },
  {
    number: 4,
    content: "",
    explanation: {
      what: "Empty line for code readability and logical separation between import statements and class definitions, following PEP 8 Python style guidelines.",
      why: "Part of the automated code formatting applied by Eric Martinez when he set up the pre-commit hooks for consistent code style across the team.",
      source: "Formatting applied by Eric Martinez in commit def456hi for ticket DEV-OPS-23. This ensures consistent spacing throughout the codebase."
    }
  },
  {
    number: 5,
    content: "class PaymentProcessor:",
    explanation: {
      what: "Main payment processing class that encapsulates all payment-related functionality including transaction handling, retry logic, error management, and gateway communication. Implements the facade pattern to simplify complex payment operations.",
      why: "Eric Martinez created this centralized class after the 2023 queue migration caused distributed payment failures across multiple microservices. The previous approach had payment logic scattered across different services, making debugging and maintenance difficult.",
      source: "Refactored by Eric Martinez in commit def456gh for ticket PAY-457. This replaced the previous distributed payment handlers that were causing race conditions after the message queue upgrade."
    }
  },
  {
    number: 6,
    content: "    def __init__(self, config: Dict):",
    explanation: {
      what: "Constructor method that initializes the PaymentProcessor instance with configuration parameters. Takes a dictionary containing all necessary settings for payment processing.",
      why: "Eric Martinez designed this to accept a configuration dictionary for flexibility, allowing different payment processor instances with different settings (test vs production, different retry counts, etc.).",
      source: "Implemented by Eric Martinez in commit def456gh for ticket PAY-457. The flexible configuration approach was requested by the DevOps team for easier environment-specific deployments."
    }
  },
  {
    number: 7,
    content: "        self.config = config",
    explanation: {
      what: "Stores the configuration dictionary as an instance variable for use throughout the class methods. This allows all methods to access configuration settings without passing parameters repeatedly.",
      why: "Eric Martinez chose to store the entire config object rather than individual properties to maintain flexibility and reduce the number of instance variables as the configuration grows.",
      source: "Implemented by Eric Martinez in commit def456gh for ticket PAY-457. This pattern was suggested by Sarah Chen during code review to keep the constructor clean."
    }
  },
  {
    number: 8,
    content: "        self.max_retries = config.get('max_retries', 3)",
    explanation: {
      what: "Extracts the maximum retry count from configuration with a default of 3 attempts. Uses dict.get() for safe access with fallback to prevent KeyError exceptions.",
      why: "Eric Martinez made retry count configurable after production incidents showed that different payment gateways needed different retry strategies. The default of 3 was chosen based on gateway timeout analysis.",
      source: "Added by Eric Martinez in commit ghi789jk for ticket PAY-503. The default value was determined from a week-long analysis of gateway response times during peak hours."
    }
  },
  {
    number: 9,
    content: "        self.base_delay = config.get('base_delay', 1.0)",
    explanation: {
      what: "Sets the initial delay time in seconds for the exponential backoff retry mechanism. This is the starting delay that gets multiplied for subsequent retry attempts.",
      why: "Eric Martinez made this configurable after testing showed that different environments needed different base delays. Production uses 1.0 seconds while development uses 0.1 seconds for faster testing.",
      source: "Added by Eric Martinez in commit ghi789jk for ticket PAY-503. The 1.0 second default was chosen after load testing showed it provided the best balance between quick recovery and avoiding gateway overload."
    }
  },
  {
    number: 10,
    content: "",
    explanation: {
      what: "Empty line providing visual separation between the constructor and the main processing methods, improving code readability and following Python PEP 8 style guidelines.",
      why: "Added by Eric Martinez as part of the automated code formatting rules. Sarah Chen suggested using consistent spacing to make the code easier to review during pull requests.",
      source: "Formatting applied by Eric Martinez in commit def456gh for ticket PAY-457. This spacing convention was agreed upon by the team during the architecture review meeting."
    }
  },
  {
    number: 11,
    content: "    @retry(tries=3, delay=1, backoff=2)",
    explanation: {
      what: "Decorator that implements exponential backoff retry logic with 3 attempts, starting with 1 second delay, doubling each time (1s, 2s, 4s). Automatically retries the decorated function on failure.",
      why: "Eric Martinez added this after the payment gateway started experiencing intermittent timeouts during peak shopping hours, causing customer frustration and lost revenue. The exponential backoff prevents overwhelming the gateway during outages.",
      source: "Added by Eric Martinez in commit ghi789jk for ticket PAY-503. The specific parameters were tuned based on gateway SLA documentation and response time monitoring data from the previous month."
    }
  },
  {
    number: 12,
    content: "    def process_payment(self, amount: float, card_token: str) -> Dict:",
    explanation: {
      what: "Main public method for processing payments. Takes a payment amount and tokenized card information, returns a dictionary with transaction results. Uses type hints for better code documentation.",
      why: "Eric Martinez designed this as the primary interface for payment processing, abstracting away the complexity of gateway communication, validation, and error handling from the calling code.",
      source: "Implemented by Eric Martinez in commit def456gh for ticket PAY-457. The method signature was reviewed by Sarah Chen to ensure it matched the frontend API expectations."
    }
  },
  {
    number: 13,
    content: "        \"\"\"Process payment with automatic retry logic\"\"\"",
    explanation: {
      what: "Python docstring documenting the method's purpose. Follows Google-style docstring conventions for automatic documentation generation and IDE support.",
      why: "Michael Rodriguez established the documentation standards requiring all public methods to have docstrings. This helps new team members understand method purposes without reading implementation details.",
      source: "Documentation standard enforced by Michael Rodriguez in commit lmn890op for ticket QUALITY-18. All existing methods were updated to include docstrings during the code quality initiative."
    }
  },
  {
    number: 14,
    content: "        try:",
    explanation: {
      what: "Begins a try-except block for comprehensive error handling during payment processing. This catches any exceptions that might occur during gateway communication or response validation.",
      why: "Eric Martinez implemented robust error handling after production incidents where unhandled exceptions caused payment processing to fail silently, leading to customer service complaints and revenue loss.",
      source: "Added by Eric Martinez in commit def456gh for ticket PAY-457. The error handling strategy was designed based on post-mortem analysis of payment processing failures from Q4 2023."
    }
  },
  {
    number: 15,
    content: "            response = self._call_payment_gateway(amount, card_token)",
    explanation: {
      what: "Calls the private method to communicate with the payment gateway, passing the transaction amount and tokenized card data. Returns the raw gateway response for further processing.",
      why: "Eric Martinez separated gateway communication into a private method to isolate network-related code and make it easier to mock during testing. This also allows for gateway-specific logic without cluttering the main method.",
      source: "Implemented by Eric Martinez in commit def456gh for ticket PAY-457. The separation was suggested by Sarah Chen during code review to improve testability."
    }
  },
  {
    number: 16,
    content: "            return self._validate_response(response)",
    explanation: {
      what: "Calls the response validation method to ensure the gateway response contains all required fields and indicates a successful transaction before returning to the caller.",
      why: "Eric Martinez added this validation step after discovering that the previous version would sometimes return partial or invalid responses as successful transactions, causing accounting discrepancies.",
      source: "Added by Eric Martinez in commit jkl012mn for ticket PAY-601. This was implemented after a financial audit revealed several transactions with incomplete response data."
    }
  },
  {
    number: 17,
    content: "        except PaymentGatewayError as e:",
    explanation: {
      what: "Catches specific PaymentGatewayError exceptions that may be raised during gateway communication or response processing. This allows for payment-specific error handling.",
      why: "Eric Martinez created a custom exception hierarchy to distinguish between different types of payment failures (network issues, declined cards, invalid data) for better error reporting and monitoring.",
      source: "Exception handling added by Eric Martinez in commit def456gh for ticket PAY-457. The custom exception classes were created to improve error tracking in production monitoring."
    }
  },
  {
    number: 18,
    content: "            self._log_payment_error(e, amount, card_token)",
    explanation: {
      what: "Logs detailed error information including the exception details, transaction amount, and (masked) card token for debugging and monitoring purposes. Sensitive data is properly masked.",
      why: "Eric Martinez added comprehensive logging after support tickets showed that debugging payment failures was difficult without sufficient context. The logging includes enough detail for troubleshooting while protecting sensitive data.",
      source: "Logging added by Eric Martinez in commit def456gh for ticket PAY-457. The log format was designed to integrate with the existing ELK stack monitoring system."
    }
  },
  {
    number: 19,
    content: "            raise",
    explanation: {
      what: "Re-raises the caught exception after logging, allowing the calling code to handle the error appropriately. This maintains the exception chain for proper error propagation.",
      why: "Eric Martinez chose to re-raise rather than suppress exceptions so that calling code can implement appropriate fallback behavior (retry different gateway, notify user, etc.).",
      source: "Exception handling strategy by Eric Martinez in commit def456gh for ticket PAY-457. This approach was recommended by Michael Rodriguez based on error handling best practices."
    }
  },
  {
    number: 20,
    content: "",
    explanation: {
      what: "Empty line providing visual separation between the main payment processing method and helper methods, following Python code style conventions for improved readability.",
      why: "Added by Eric Martinez as part of consistent code formatting. The team agreed during code review sessions that proper spacing makes method boundaries clearer during debugging sessions.",
      source: "Formatting applied by Eric Martinez in commit def456gh for ticket PAY-457. This spacing convention was established during the team's coding standards meeting."
    }
  },
  {
    number: 21,
    content: "    def _validate_response(self, response: Dict) -> Dict:",
    explanation: {
      what: "Private method that validates payment gateway responses to ensure all required fields are present and values are within expected ranges. Returns the validated response or raises an exception for invalid data.",
      why: "Eric Martinez created this after discovering that the previous version didn't validate gateway responses, leading to silent failures and inconsistent payment states that caused accounting discrepancies and customer service issues.",
      source: "Added by Eric Martinez in commit jkl012mn for ticket PAY-601. This validation was implemented after a financial audit revealed transactions with incomplete or invalid response data from certain gateway configurations."
    }
  },
];

export function CodeViewer({ onLineSelect }: CodeViewerProps) {
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [highlightedLines, setHighlightedLines] = useState<number[]>([]);

  const handleLineClick = (line: CodeLine) => {
    if (line.explanation) {
      setSelectedLine(line.number);
      setHighlightedLines([line.number]);
      onLineSelect(line);
    } else {
      const defaultExplanation = {
        what: `Line ${line.number}: ${line.content || 'Empty line'}. This represents ${line.content ? 'a code statement' : 'formatting/spacing'} in the Python payment processing system.`,
        why: `This line contributes to the overall structure and functionality of the payment processor. ${line.content ? 'It follows Python coding standards and team conventions established during development.' : 'Empty lines improve code readability and follow PEP 8 style guidelines.'}`,
        source: `Part of the payment processing system. Line formatting and structure maintained by the development team according to established coding standards.`,
        how: `${line.content ? 'This code executes as part of the Python interpreter processing, following standard execution flow.' : 'This empty line serves as visual separation, improving code readability without affecting execution.'}`
      };
      setSelectedLine(line.number);
      setHighlightedLines([line.number]);
      onLineSelect({ ...line, explanation: defaultExplanation });
    }
  };

  return (
    <Card className="h-full overflow-hidden bg-editor-bg border-editor-border">
      <div className="p-4 border-b border-editor-border bg-editor-line">
        <div className="flex items-center gap-2 text-editor-foreground">
          <span className="text-sm font-mono">services/payments_v2.py</span>
          <span className="w-2 h-2 bg-green-400 rounded-full"></span>
        </div>
      </div>
      
      <div className="overflow-auto h-full code-editor">
        <div className="min-h-full">
          {sampleCode.map((line) => (
            <div
              key={line.number}
              className={`flex items-start hover:bg-editor-line/50 transition-colors cursor-pointer ${
                highlightedLines.includes(line.number) ? 'line-highlight bg-editor-highlight/10' : ''
              } ${line.explanation ? 'hover:bg-primary/5' : 'hover:bg-primary/5'}`}
              onClick={() => handleLineClick(line)}
            >
              <div className="w-12 flex-shrink-0 text-right pr-4 py-1 text-editor-foreground/50 text-sm select-none">
                {line.number}
              </div>
              <div className="flex-1 py-1 pr-4 text-editor-foreground">
                <code className="text-sm">{line.content || '\u00A0'}</code>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}