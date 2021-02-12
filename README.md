# TinyUrl version 1.0.0

This is an application for manage the tinyUrl and custom redirects

## Requirements

- DynamoDB: for save the short url and parameters

## Getting start

1) Edit the ```config.json``` file for insert the AWS data (DynamoDB)
2) Edit file ```.env.example``` for change the parameter of application
3) Rename ```.env.example``` into ```.env```
4) run ```npm install```

## Tutorial

## Generate TinyURL
**Verb**​:P​OST
**Parameter**:
- originalUrl​ (required)
- timesToExpire 
- expiredDate​
- redirectType​
- mode

### Example
```
{
"originalUrl":"​https://www.google.it​",
"redirectType":302,
"mode":"EXPCOUNTER",
"timesToExpire":10,
}
```

## Call TinyUrl
**Verb**​:GET
**Url**: {{serverUrl}}/{{tinyID}}


## Parameters
| Parameter     | Description                                                                                                  | Required? | Default value | Allowed values                     |
|---------------|--------------------------------------------------------------------------------------------------------------|-----------|---------------|------------------------------------|
| originalUrl   | original url to convert                                                                                      | Y         |               | string                             |
| timesToExpire | How many times can' be recalled the tinyUrl before going in state BURNT. verified in case of EXPCOUNTER mode | N         |               | integer                            |
| expiredDate   | Date of expire in the format (gg/mm/yyyy)                                                                    | N         |               | IT date                            |
| redirectType  | Response type for redirect                                                                                   | Y         |               | 301 \| 302                         |
| mode          | Indicates the mode' of deactivation of the tinyUrl                                                           | N         | ETERNAL       | EXPDATE \| EXPCOUNTER \|\| ETERNAL |
|               |                                                                                                              |           |               |                                    |
|               |                                                                                                              |           |               |                                    |